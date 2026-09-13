using backend.Modules.Event.Contracts;
using backend.Modules.Event.Domain;

namespace backend.Modules.Event.Services;

public interface IEventPhaseService
{
    Task<EventPhaseSnapshot> GetSnapshotAsync(CancellationToken ct);
    Task<EventPhaseSnapshot> UpdateAsync(UpdateEventRequest request, Guid updatedBy, CancellationToken ct);
    Task<bool> TryReserveSaleWindowSlotAsync(SaleWindowKind kind, CancellationToken ct);
}