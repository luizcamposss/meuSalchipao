using backend.Modules.Event.Contracts;

namespace backend.Modules.Event.Services;

public interface IEventPhaseService
{
    Task<EventPhaseSnapshot> GetSnapshotAsync(CancellationToken ct);
    Task<EventPhaseSnapshot> UpdateAsync(UpdateEventRequest request, Guid updatedBy, CancellationToken ct);
    Task<SaleWindowResponse> CreateSaleWindowAsync(CreateSaleWindowRequest request, CancellationToken ct);
    Task<SaleWindowResponse> UpdateSaleWindowAsync(Guid windowId, UpdateSaleWindowRequest request, CancellationToken ct);
    Task DeleteSaleWindowAsync(Guid windowId, CancellationToken ct);
    Task<bool> TryReserveSlotAsync(Guid windowId, CancellationToken ct);
}