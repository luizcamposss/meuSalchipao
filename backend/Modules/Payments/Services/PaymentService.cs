using backend.Modules.Event.Services;
using backend.Modules.Orders.Domain;
using backend.Modules.Payments.Contracts;
using backend.Modules.Payments.Domain;
using backend.Modules.Payments.Gateway;
using backend.Shared.Exceptions;
using backend.Shared.Persistence;
using Microsoft.EntityFrameworkCore;

namespace backend.Modules.Payments.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;
    private readonly MercadoPagoClient _mp;
    private readonly IEventPhaseService _events;
    private readonly TimeProvider _clock;
    private readonly IConfiguration _config;
    private const int PixTtlMinutes = 30;

    public PaymentService(AppDbContext context, MercadoPagoClient mp, IEventPhaseService events, TimeProvider clock, IConfiguration config)
    {
        _context = context;
        _mp = mp;
        _events = events;
        _clock = clock;
        _config = config;
    }

    public async Task<PaymentResponse> CreateForOrderAsync(Guid orderId, Guid userId, CancellationToken ct)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order is null || order.UserId != userId)
            throw new NotFoundException("Order not found.");

        if (order.Status != OrderStatus.AwaitingPayment)
            throw new ConflictException("Order is not awaiting payment.");

        var now = _clock.GetUtcNow();

        var existing = await _context.Payments
            .FirstOrDefaultAsync(p =>
                p.OrderId == orderId
                && p.Status == PaymentStatus.Pending
                && p.ExpiresAt > now.UtcDateTime, ct);

        if (existing is not null)
            return Map(existing);

        var phase = await _events.GetSnapshotAsync(ct);
        if (!phase.SalesOpen)
            throw new ConflictException("Sales are closed.");

        var ttlExpiry = now.AddMinutes(PixTtlMinutes);
        var cutoff = new DateTimeOffset(phase.SalesCloseAt, TimeSpan.Zero);
        var expiresAt = ttlExpiry < cutoff ? ttlExpiry : cutoff;

        var user = await _context.Users.FirstAsync(u => u.Id == userId, ct);

        var paymentId = Guid.NewGuid();

        var request = new CreatePixPaymentRequest(
            TransactionAmount: order.Total,
            PaymentMethodId: "pix",
            Description: $"Pedido {order.Id}",
            ExternalReference: order.Id.ToString(),
            NotificationUrl: $"{_config["MercadoPago:NotificationBaseUrl"]}/webhooks/mercadopago",
            DateOfExpiration: expiresAt.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"),
            Payer: new MpPayer(user.Email, user.Name));

        var mpPayment = await _mp.CreatePixPaymentAsync(request, paymentId.ToString(), ct);
        var data = mpPayment.PointOfInteraction?.TransactionData;

        var payment = new Payment
        {
            Id = paymentId,
            OrderId = order.Id,
            Provider = "mercadopago",
            ExternalId = mpPayment.Id.ToString(),
            Status = MercadoPagoStatusMap.ToPaymentStatus(mpPayment.Status),
            StatusDetail = mpPayment.StatusDetail,
            Amount = order.Total,
            PixCode = data?.QrCode,
            PixQrCodeBase64 = data?.QrCodeBase64,
            ExpiresAt = expiresAt.UtcDateTime,
            CreatedAt = now.UtcDateTime,
            UpdatedAt = now.UtcDateTime,
        };

        _context.Add(payment);
        await _context.SaveChangesAsync(ct);

        return Map(payment);
    }

    public async Task<PaymentResponse?> GetForUserAsync(Guid paymentId, Guid userId, bool isStaff, CancellationToken ct)
    {
        var payment = await _context.Payments
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct);

        if (payment is null)
            return null;

        var ownerId = await _context.Orders
            .Where(o => o.Id == payment.OrderId)
            .Select(o => o.UserId)
            .FirstOrDefaultAsync(ct);

        if (!isStaff && ownerId != userId)
            return null;

        return Map(payment);
    }

    private static PaymentResponse Map(Payment p) => new(
        p.Id, p.Status, p.PixCode, p.PixQrCodeBase64, p.ExpiresAt, p.Amount);

    public async Task HandlePaymentNotificationAsync(
        string dataId, string notificationId, string? action, CancellationToken ct)
    {
        // Idempotency: MP retries the same notification. If we already recorded it, stop.
        if (await _context.PaymentWebhookEvents.AnyAsync(e => e.EventId == notificationId, ct))
            return;

        // Authoritative status — the webhook body never carries it.
        var mpPayment = await _mp.GetPaymentAsync(dataId, ct);
        var now = _clock.GetUtcNow().UtcDateTime;
        var newStatus = MercadoPagoStatusMap.ToPaymentStatus(mpPayment.Status);

        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.ExternalId == dataId, ct);

        if (payment is not null)
        {
            payment.Status = newStatus;
            payment.StatusDetail = mpPayment.StatusDetail;
            payment.LastWebhookAt = now;
            payment.UpdatedAt = now;
            if (newStatus == PaymentStatus.Approved && payment.ApprovedAt is null)
                payment.ApprovedAt = mpPayment.DateApproved?.UtcDateTime ?? now;

            var order = await _context.Orders.FirstAsync(o => o.Id == payment.OrderId, ct);

            if (order.Status == OrderStatus.AwaitingPayment)
            {
                if (newStatus == PaymentStatus.Approved)
                {
                    order.PaymentStatus = PaymentStatus.Approved;
                    order.Status = OrderStatus.Paid;          // ticket becomes valid
                    order.UpdatedAt = now;
                }
                else if (newStatus is PaymentStatus.Rejected or PaymentStatus.Expired)
                {
                    order.PaymentStatus = newStatus;
                    order.Status = OrderStatus.Cancelled;
                    order.UpdatedAt = now;
                }
                // pending / in_process -> leave the order awaiting
            }
            else if (newStatus == PaymentStatus.Approved
                     && order.Status is not (OrderStatus.Paid or OrderStatus.Redeemed))
            {
                // approved landed on a Cancelled order (sales cutoff). "Pagou não volta" —
                // Staff resolves this by hand. Just leave a trail.
                // TODO(M8): structured alert log
            }
        }

        _context.Add(new PaymentWebhookEvent
        {
            Id = Guid.NewGuid(),
            EventId = notificationId,
            PaymentId = dataId,
            Action = action ?? string.Empty,
            ProcessedAt = now,
        });

        try
        {
            await _context.SaveChangesAsync(ct);   // payment + order + event, one transaction
        }
        catch (DbUpdateException ex) when (ex.InnerException is MySqlConnector.MySqlException { Number: 1062 })
        {
            // A concurrent retry recorded the same notification first. Its work is
            // identical to ours (idempotent status writes), so this is fine.
        }
    }
}
