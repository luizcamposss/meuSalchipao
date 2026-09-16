using System.ComponentModel.DataAnnotations;
using backend.Modules.Event.Contracts;
using backend.Modules.Event.Domain;
using backend.Shared.Exceptions;
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
            .Include(e => e.SaleWindows)
            .FirstAsync(ct);

        return Compute(settings);
    }

    public async Task<EventPhaseSnapshot> UpdateAsync(UpdateEventRequest request, Guid updatedBy, CancellationToken ct)
    {
        if (request.SalesOpenAt >= request.SalesCloseAt)
            throw new ValidationException("SalesOpenAt must be before SalesCloseAt.");

        var settings = await _context.Events
            .Include(e => e.SaleWindows)
            .FirstAsync(ct);

        settings.SalesOpenAt = request.SalesOpenAt;
        settings.SalesCloseAt = request.SalesCloseAt;
        settings.RedemptionOpensAt = request.RedemptionOpensAt;
        settings.ForcedPhase = request.ForcedPhase;
        settings.UpdatedAt = _clock.GetUtcNow().UtcDateTime;
        settings.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync(ct);

        return Compute(settings);
    }

    public async Task<SaleWindowResponse> CreateSaleWindowAsync(CreateSaleWindowRequest request, CancellationToken ct)
    {
        if (request.OpensAt >= request.ClosesAt)
            throw new ValidationException("OpensAt must be before ClosesAt.");

        var settings = await _context.Events.FirstAsync(ct);

        var window = new SaleWindow
        {
            Id = Guid.NewGuid(),
            EventSettingsId = settings.Id,
            Label = request.Label,
            OpensAt = request.OpensAt,
            ClosesAt = request.ClosesAt,
            Cap = request.Cap,
            Count = 0,
        };

        _context.Add(window);
        await _context.SaveChangesAsync(ct);

        return BuildWindow(window, _clock.GetUtcNow().UtcDateTime, settings.ForcedPhase);
    }

    public async Task<SaleWindowResponse> UpdateSaleWindowAsync(Guid windowId, UpdateSaleWindowRequest request, CancellationToken ct)
    {
        if (request.OpensAt >= request.ClosesAt)
            throw new ValidationException("OpensAt must be before ClosesAt.");

        var window = await _context.SaleWindows.FirstOrDefaultAsync(w => w.Id == windowId, ct);
        if (window is null)
            throw new NotFoundException("Sale window not found.");

        window.Label = request.Label;
        window.OpensAt = request.OpensAt;
        window.ClosesAt = request.ClosesAt;
        window.Cap = request.Cap;

        await _context.SaveChangesAsync(ct);

        var settings = await _context.Events.AsNoTracking().FirstAsync(ct);
        return BuildWindow(window, _clock.GetUtcNow().UtcDateTime, settings.ForcedPhase);
    }

    public async Task DeleteSaleWindowAsync(Guid windowId, CancellationToken ct)
    {
        var affected = await _context.SaleWindows
            .Where(w => w.Id == windowId)
            .ExecuteDeleteAsync(ct);

        if (affected == 0)
            throw new NotFoundException("Sale window not found.");
    }

    public async Task<bool> TryReserveSlotAsync(Guid windowId, CancellationToken ct)
    {
        var affected = await _context.SaleWindows
            .Where(w => w.Id == windowId && w.Count < w.Cap)
            .ExecuteUpdateAsync(s => s.SetProperty(w => w.Count, w => w.Count + 1), ct);

        return affected > 0;
    }

    private EventPhaseSnapshot Compute(EventSettings settings)
    {
        var now = _clock.GetUtcNow().UtcDateTime;

        var (regularSalesOpen, redemptionOpen) = settings.ForcedPhase switch
        {
            ForcedPhase.Closed => (false, false),
            ForcedPhase.SalesOnly => (true, false),
            ForcedPhase.RedemptionOnly => (false, true),
            ForcedPhase.Auto => (
                now >= settings.SalesOpenAt && now < settings.SalesCloseAt,
                now >= settings.RedemptionOpensAt),
            _ => (false, false),
        };

        var saleWindows = settings.SaleWindows
            .Select(w => BuildWindow(w, now, settings.ForcedPhase))
            .OrderBy(w => w.OpensAt)
            .ToList();

        var salesOpen = regularSalesOpen || saleWindows.Any(w => w.Open);

        var phase = (regularSalesOpen, redemptionOpen) switch
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
            settings.ForcedPhase,
            settings.SalesOpenAt,
            settings.SalesCloseAt,
            settings.RedemptionOpensAt,
            now,
            saleWindows);
    }

    private static SaleWindowResponse BuildWindow(SaleWindow window, DateTime now, ForcedPhase forcedPhase)
    {
        var remaining = Math.Max(0, window.Cap - window.Count);
        var open = forcedPhase == ForcedPhase.Auto
            && now >= window.OpensAt && now < window.ClosesAt
            && remaining > 0;

        return new SaleWindowResponse(
            window.Id, window.Label, open, window.OpensAt, window.ClosesAt, window.Cap, remaining);
    }
}
