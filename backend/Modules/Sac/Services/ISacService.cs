using backend.Modules.Sac.Contracts;
using backend.Modules.Sac.Domain;

namespace backend.Modules.Sac.Services;

public interface ISacService
{
    Task<SacTicketResponse> CreateTicketAsync(Guid userId, CreateTicketRequest req, CancellationToken ct);
    Task<IReadOnlyList<SacTicketResponse>> GetMineAsync(Guid userId, CancellationToken ct);
    Task<IReadOnlyList<SacTicketResponse>> GetAllAsync(SacTicketStatus? status, CancellationToken ct);
    Task<SacTicketResponse?> GetByIdAsync(Guid ticketId, Guid userId, bool isStaff, CancellationToken ct);
    Task<SacMessageResponse> AddMessageAsync(Guid ticketId, Guid senderId, bool isStaff, AddMessageRequest req, CancellationToken ct);
    Task<SacTicketResponse> UpdateAsync(Guid ticketId, UpdateTicketRequest req, CancellationToken ct);
}
