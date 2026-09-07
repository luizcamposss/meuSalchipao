using AutoMapper;
using backend.Modules.Event.Services;
using backend.Modules.Orders.Contracts;
using backend.Modules.Orders.Domain;
using backend.Shared.Exceptions;
using backend.Shared.Persistence;
using Microsoft.EntityFrameworkCore;

namespace backend.Modules.Orders.Services;

public class RedemptionService : IRedemptionService
{
    private readonly AppDbContext _context;
    private readonly IEventPhaseService _events;
    private readonly TimeProvider _clock;
    private readonly IMapper _mapper;

    public RedemptionService(AppDbContext context, IEventPhaseService events, TimeProvider clock, IMapper mapper)
    {
        _context = context;
        _events = events;
        _clock = clock;
        _mapper = mapper;
    }

    public async Task<TicketResponse?> GetTicketAsync(Guid orderId, Guid userId, bool isStaff, CancellationToken ct)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order is null)
            return null;

        if (!isStaff && order.UserId != userId)
            return null;

        if (order.Status is not (OrderStatus.Paid or OrderStatus.Redeemed))
            return null;

        return ToTicket(order);
    }

    public async Task<TicketResponse> RedeemAsync(Guid orderId, Guid userId, CancellationToken ct)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        // Fast, clear errors for the common cases.
        if (order is null || order.UserId != userId)
            throw new NotFoundException("Order not found.");

        var phase = await _events.GetSnapshotAsync(ct);
        if (!phase.RedemptionOpen)
            throw new ConflictException("Redemption is not open yet.");

        if (order.Status == OrderStatus.Redeemed)
            throw new ConflictException($"Ticket already redeemed at {order.RedeemedAt:yyyy-MM-dd HH:mm} UTC.");

        if (order.Status != OrderStatus.Paid)
            throw new ConflictException("Order is not paid.");

        var now = _clock.GetUtcNow().UtcDateTime;

        // Race-safe: a single atomic UPDATE ... WHERE Status = 'Paid'. Of two concurrent
        // redeems only one touches a row; the other gets 0 rows affected.
        var affected = await _context.Orders
            .Where(o => o.Id == orderId && o.Status == OrderStatus.Paid)
            .ExecuteUpdateAsync(s => s
                .SetProperty(o => o.Status, OrderStatus.Redeemed)
                .SetProperty(o => o.RedeemedAt, now)
                .SetProperty(o => o.UpdatedAt, now), ct);

        var fresh = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .FirstAsync(o => o.Id == orderId, ct);

        if (affected == 0)
            // Someone redeemed it between the check above and here.
            throw new ConflictException(
                $"Ticket already redeemed at {fresh.RedeemedAt:yyyy-MM-dd HH:mm} UTC.");

        return ToTicket(fresh);
    }

    private TicketResponse ToTicket(Order order) => new(
        order.Id,
        order.Status,
        order.Total,
        order.CreatedAt,
        order.RedeemedAt,
        order.Id.ToString(),
        _mapper.Map<List<OrderItemResponse>>(order.Items));
}
