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
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

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
        order.Status = OrderStatus.Redeemed;
        order.RedeemedAt = now;
        order.UpdatedAt = now;

        await _context.SaveChangesAsync(ct);

        return ToTicket(order);
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
