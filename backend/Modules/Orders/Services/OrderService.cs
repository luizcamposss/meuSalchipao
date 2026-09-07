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
