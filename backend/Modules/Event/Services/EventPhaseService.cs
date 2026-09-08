using System.ComponentModel.DataAnnotations;
using backend.Modules.Event.Contracts;
using backend.Modules.Event.Domain;
using backend.Shared.Persistence;
using Microsoft.EntityFrameworkCore;

namespace backend.Modules.Event.Services;

public class EventPhaseService : IEventPhaseService
{
    private readonly AppDbContext _context;
    private readonly TimeProvider _clock;

    public EventPhaseService(AppDbContext context, TimeProvider clock)
    {
        _context = context;
        _clock = clock;
    }

    public async Task<EventPhaseSnapshot> GetSnapshotAsync(CancellationToken ct)
    {
        var settings = await _context.Events
            .AsNoTracking()
            .FirstAsync(ct);

        return Compute(settings);
    }

    public async Task<EventPhaseSnapshot> UpdateAsync(UpdateEventRequest request, Guid updatedBy, CancellationToken ct)
    {
        if (request.SalesOpenAt >= request.SalesCloseAt)
            throw new ValidationException("SalesOpenAt must be before SalesCloseAt.");

        var settings = await _context.Events.FirstAsync(ct);

        settings.SalesOpenAt = request.SalesOpenAt;
        settings.SalesCloseAt = request.SalesCloseAt;
        settings.RedemptionOpensAt = request.RedemptionOpensAt;
        settings.ForcedPhase = request.ForcedPhase;
        settings.UpdatedAt = _clock.GetUtcNow().UtcDateTime;
        settings.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync(ct);

        return Compute(settings);
    }

    private EventPhaseSnapshot Compute(EventSettings settings)
    {
        var now = _clock.GetUtcNow().UtcDateTime;

        var (salesOpen, redemptionOpen) = settings.ForcedPhase switch
        {
            ForcedPhase.Closed => (false, false),
            ForcedPhase.SalesOnly => (true, false),
            ForcedPhase.RedemptionOnly => (false, true),
            ForcedPhase.Auto => (
                now >= settings.SalesOpenAt && now < settings.SalesCloseAt,
                now >= settings.RedemptionOpensAt),
            _ => (false, false),
        };

        var phase = (salesOpen, redemptionOpen) switch
        {
            (true, _) => "SalesOpen",
            (false, true) => "RedemptionOnly",
            (false, false) when now < settings.SalesOpenAt => "BeforeSales",
            _ => "SalesClosed",
        };

        return new EventPhaseSnapshot(
            salesOpen,
            redemptionOpen,
            phase,
            settings.SalesOpenAt,
            settings.SalesCloseAt,
            settings.RedemptionOpensAt,
            now);
    }
}
