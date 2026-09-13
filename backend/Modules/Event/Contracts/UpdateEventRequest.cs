using backend.Modules.Event.Domain;

namespace backend.Modules.Event.Contracts;

public record UpdateEventRequest
{
    public DateTime SalesOpenAt { get; init; }
    public DateTime SalesCloseAt { get; init; }
    public DateTime RedemptionOpensAt { get; init; }
    public ForcedPhase ForcedPhase { get; init; }
    public DateTime MorningSaleOpensAt { get; init; }
    public DateTime MorningSaleClosesAt { get; init; }
    public int MorningSaleCap { get; init; }
    public DateTime AfternoonSaleOpensAt { get; init; }
    public DateTime AfternoonSaleClosesAt { get; init; }
    public int AfternoonSaleCap { get; init; }
}
