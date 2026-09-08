using System.ComponentModel.DataAnnotations;
using AutoMapper;
using backend.Modules.Event.Services;
using backend.Modules.Orders.Contracts;
using backend.Modules.Orders.Domain;
using backend.Shared.Exceptions;
using backend.Shared.Persistence;
using Microsoft.EntityFrameworkCore;

namespace backend.Modules.Orders.Services;

public class OrderService : IOrderService
{
    private readonly AppDbContext _context;
    private readonly IEventPhaseService events;
    private readonly TimeProvider clock;
    private readonly IMapper mapper;
    private const int MaxItemsPerOrder = 4;

    public OrderService(AppDbContext context, IEventPhaseService events, TimeProvider clock, IMapper mapper)
    {
        _context = context;
        this.events = events;
        this.clock = clock;
        this.mapper = mapper;
    }

    public async Task<OrderResponse> CreateOrderAsync(Guid userId, CreateOrderRequest request, CancellationToken ct)
    {
        var phase = await events.GetSnapshotAsync(ct);
        if (!phase.SalesOpen)
            throw new ConflictException("Sales are closed.");

        if (request.Items is null || request.Items.Count == 0)
            throw new ValidationException("An order must have at least one item.");

        if (request.Items.Any(i => i.Quantity <= 0))
            throw new ValidationException("Quantity must be greater than zero.");

        var requestedQty = request.Items
            .GroupBy(i => i.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));

        if (requestedQty.Values.Sum() > MaxItemsPerOrder )
            throw new ValidationException($"An order can have at most {MaxItemsPerOrder} items.");
        var productIds = requestedQty.Keys.ToList();

        var products = await _context.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(ct);

        if (productIds.Except(products.Select(p => p.Id)).Any())
            throw new ValidationException("One or more products do not exist.");

        if (products.Any(p => !p.Available))
            throw new ConflictException("One or more products are not available.");

        var now = clock.GetUtcNow().UtcDateTime;
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Status = OrderStatus.AwaitingPayment,
            PaymentStatus = PaymentStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now,
            Items = products.Select(p => new OrderItem
            {
                Id = Guid.NewGuid(),
                ProductId = p.Id,
                ProductName = p.Name,     
                UnitPrice = p.Price,      
                Quantity = requestedQty[p.Id],
            }).ToList(),
        };

        order.Total = order.Items.Sum(i => i.UnitPrice * i.Quantity);

        _context.Add(order);
        await _context.SaveChangesAsync(ct);

        return mapper.Map<OrderResponse>(order);
    }

    public async Task<IReadOnlyList<OrderResponse>> GetMineAsync(Guid userId, CancellationToken ct)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);

        return mapper.Map<List<OrderResponse>>(orders);
    }

    public async Task<OrderStatsResponse> GetStatsAsync(CancellationToken ct)
    {
        // "Vendido" = pedido que chegou a pago (Paid) ou já foi resgatado (Redeemed).
        var salchiposSold = await _context.OrderItems
            .AsNoTracking()
            .Where(i => i.Order.Status == OrderStatus.Paid || i.Order.Status == OrderStatus.Redeemed)
            .SumAsync(i => (int?)i.Quantity, ct) ?? 0;

        var revenue = await _context.Orders
            .AsNoTracking()
            .Where(o => o.Status == OrderStatus.Paid || o.Status == OrderStatus.Redeemed)
            .SumAsync(o => (decimal?)o.Total, ct) ?? 0m;

        var ticketsToRedeem = await _context.Orders
            .AsNoTracking()
            .CountAsync(o => o.Status == OrderStatus.Paid, ct);

        var ticketsRedeemed = await _context.Orders
            .AsNoTracking()
            .CountAsync(o => o.Status == OrderStatus.Redeemed, ct);

        // Vendas por dia. Poucos pedidos num evento escolar — agrega em memória
        // pra poder converter o instante UTC pro dia no fuso de Brasília sem
        // depender de tradução SQL de fuso.
        var paidRows = await _context.Orders
            .AsNoTracking()
            .Where(o => o.Status == OrderStatus.Paid || o.Status == OrderStatus.Redeemed)
            .Select(o => new { o.CreatedAt, Qty = o.Items.Sum(i => i.Quantity), o.Total })
            .ToListAsync(ct);

        var brasilia = TimeSpan.FromHours(-3); // sem horário de verão desde 2019
        var byDay = paidRows
            .GroupBy(r => DateOnly.FromDateTime(r.CreatedAt + brasilia))
            .Select(g => new DailySales(g.Key, g.Sum(r => r.Qty), g.Sum(r => r.Total)))
            .OrderBy(d => d.Day)
            .ToList();

        return new OrderStatsResponse
        {
            SalchiposSold = salchiposSold,
            Revenue = revenue,
            TicketsToRedeem = ticketsToRedeem,
            TicketsRedeemed = ticketsRedeemed,
            TicketsGenerated = ticketsToRedeem + ticketsRedeemed,
            ByDay = byDay,
        };
    }

    public async Task<OrderResponse?> GetByIdAsync(Guid id, Guid userId, bool isStaff, CancellationToken ct)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order is null)
            return null;

        if (!isStaff && order.UserId != userId)
            return null;

        return mapper.Map<OrderResponse>(order);
    }
}
