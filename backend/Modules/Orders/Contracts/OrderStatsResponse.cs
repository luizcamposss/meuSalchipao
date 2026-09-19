using backend.Modules.Auth.Domain;

namespace backend.Modules.Orders.Contracts;

public record OrderStatsResponse
{
    public int SalchiposSold { get; init; }
    public decimal Revenue { get; init; }
    public int TicketsToRedeem { get; init; }
    public int TicketsRedeemed { get; init; }
    public int TicketsGenerated { get; init; }
    public IReadOnlyList<DailySales> ByDay { get; init; } = [];
    public IReadOnlyList<ShiftSales> ByShift { get; init; } = [];
}

public record DailySales(DateOnly Day, int Salchipos, decimal Revenue);

public record ShiftSales(Shift Shift, int Salchipos, decimal Revenue);
