using backend.Modules.Event.Services;
using backend.Modules.Orders.Domain;
using backend.Shared.Persistence;
using Microsoft.EntityFrameworkCore;
using PaymentStatusEnum = backend.Modules.Orders.Domain.PaymentStatus;

namespace backend.Modules.Payments.BackgroundJobs;

public class SalesCutoffWorker : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly TimeProvider _clock;
    private readonly ILogger<SalesCutoffWorker> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(2);

    public SalesCutoffWorker(IServiceProvider services, TimeProvider clock, ILogger<SalesCutoffWorker> logger)
    {
        _services = services;
        _clock = clock;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);

        do
        {
            try
            {
                await SweepAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break; // app is shutting down
            }
            catch (Exception ex)
            {
                // One bad sweep must not kill the loop.
                _logger.LogError(ex, "SalesCutoffWorker sweep failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task SweepAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var events = scope.ServiceProvider.GetRequiredService<IEventPhaseService>();

        var now = _clock.GetUtcNow().UtcDateTime;
        var phase = await events.GetSnapshotAsync(ct);
        var salesClosed = now >= phase.SalesCloseAt;

        var orders = await db.Orders
            .Where(o => o.Status == OrderStatus.AwaitingPayment)
            .Where(o => salesClosed || db.Payments.Any(p =>
                p.OrderId == o.Id
                && p.Status == PaymentStatusEnum.Pending
                && p.ExpiresAt < now))
            .ToListAsync(ct);

        if (orders.Count == 0)
            return;

        var orderIds = orders.Select(o => o.Id).ToList();

        var payments = await db.Payments
            .Where(p => orderIds.Contains(p.OrderId) && p.Status == PaymentStatusEnum.Pending)
            .ToListAsync(ct);

        foreach (var o in orders)
        {
            o.Status = OrderStatus.Cancelled;
            o.PaymentStatus = PaymentStatusEnum.Expired;
            o.UpdatedAt = now;
        }

        foreach (var p in payments)
        {
            p.Status = PaymentStatusEnum.Expired;
            p.UpdatedAt = now;
        }

        await db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "SalesCutoffWorker: cancelled {Orders} orders, expired {Payments} payments (salesClosed={Closed})",
            orders.Count, payments.Count, salesClosed);
    }
}
