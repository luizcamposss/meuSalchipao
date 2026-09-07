using backend.Modules.Event.Contracts;

namespace backend.Modules.Event.Services;

public interface IEventPhaseService
{
    Task<EventPhaseSnapshot> GetSnapshotAsync(CancellationToken ct);
    Task<EventPhaseSnapshot> UpdateAsync(UpdateEventRequest request, Guid updatedBy, CancellationToken ct);
}