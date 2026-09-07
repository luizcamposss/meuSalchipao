using backend.Modules.Orders.Contracts;

namespace backend.Modules.Orders.Services;

public interface IRedemptionService
{
    Task<TicketResponse?> GetTicketAsync(Guid orderId, Guid userId, bool isStaff, CancellationToken ct);
    Task<TicketResponse> RedeemAsync(Guid orderId, Guid userId, CancellationToken ct);
}
