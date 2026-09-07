using backend.Modules.Event.Domain;

namespace backend.Modules.Event.Contracts;

public record UpdateEventRequest
{
    public DateTime SalesOpenAt { get; init; }
    public DateTime SalesCloseAt { get; init; }
    public DateTime RedemptionOpensAt { get; init; }
    public ForcedPhase ForcedPhase { get; init; }
}
