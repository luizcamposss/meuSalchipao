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

        if (request.MorningSaleOpensAt >= request.MorningSaleClosesAt)
            throw new ValidationException("MorningSaleOpensAt must be before MorningSaleClosesAt.");

        if (request.AfternoonSaleOpensAt >= request.AfternoonSaleClosesAt)
            throw new ValidationException("AfternoonSaleOpensAt must be before AfternoonSaleClosesAt.");

        var settings = await _context.Events.FirstAsync(ct);

        settings.SalesOpenAt = request.SalesOpenAt;
        settings.SalesCloseAt = request.SalesCloseAt;
        settings.RedemptionOpensAt = request.RedemptionOpensAt;
        settings.ForcedPhase = request.ForcedPhase;
        settings.MorningSaleOpensAt = request.MorningSaleOpensAt;
        settings.MorningSaleClosesAt = request.MorningSaleClosesAt;
        settings.MorningSaleCap = request.MorningSaleCap;
        settings.AfternoonSaleOpensAt = request.AfternoonSaleOpensAt;
        settings.AfternoonSaleClosesAt = request.AfternoonSaleClosesAt;
        settings.AfternoonSaleCap = request.AfternoonSaleCap;
        settings.UpdatedAt = _clock.GetUtcNow().UtcDateTime;
        settings.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync(ct);

        return Compute(settings);
    }

    public async Task<bool> TryReserveSaleWindowSlotAsync(SaleWindowKind kind, CancellationToken ct)
    {
        var affected = kind switch
        {
            SaleWindowKind.Morning => await _context.Events
                .Where(e => e.MorningSaleCount < e.MorningSaleCap)
                .ExecuteUpdateAsync(s => s.SetProperty(e => e.MorningSaleCount, e => e.MorningSaleCount + 1), ct),
            SaleWindowKind.Afternoon => await _context.Events
                .Where(e => e.AfternoonSaleCount < e.AfternoonSaleCap)
                .ExecuteUpdateAsync(s => s.SetProperty(e => e.AfternoonSaleCount, e => e.AfternoonSaleCount + 1), ct),
            _ => throw new ArgumentOutOfRangeException(nameof(kind)),
        };

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

        var morningSale = BuildWindow(
            settings.MorningSaleOpensAt, settings.MorningSaleClosesAt,
            settings.MorningSaleCap, settings.MorningSaleCount,
            now, settings.ForcedPhase);

        var afternoonSale = BuildWindow(
            settings.AfternoonSaleOpensAt, settings.AfternoonSaleClosesAt,
            settings.AfternoonSaleCap, settings.AfternoonSaleCount,
            now, settings.ForcedPhase);

        var salesOpen = regularSalesOpen || morningSale.Open || afternoonSale.Open;

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
            morningSale,
            afternoonSale);
    }

    private static SaleWindowSnapshot BuildWindow(
        DateTime opensAt, DateTime closesAt, int cap, int count, DateTime now, ForcedPhase forcedPhase)
    {
        var remaining = Math.Max(0, cap - count);
        var open = forcedPhase == ForcedPhase.Auto && now >= opensAt && now < closesAt && remaining > 0;
        return new SaleWindowSnapshot(open, opensAt, closesAt, cap, remaining);
    }
}
