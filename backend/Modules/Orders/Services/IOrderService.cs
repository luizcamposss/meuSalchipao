using backend.Modules.Orders.Contracts;

namespace backend.Modules.Orders.Services;

public interface IOrderService
{
    Task<OrderResponse> CreateOrderAsync(Guid userId, CreateOrderRequest request, CancellationToken ct);
    Task<IReadOnlyList<OrderResponse>> GetMineAsync(Guid userId, CancellationToken ct);
    Task<OrderResponse?> GetByIdAsync(Guid id, Guid userId, bool isStaff, CancellationToken ct);
    Task<OrderStatsResponse> GetStatsAsync(CancellationToken ct);
}
