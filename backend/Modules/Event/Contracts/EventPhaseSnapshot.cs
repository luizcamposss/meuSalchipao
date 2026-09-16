using backend.Modules.Event.Domain;

namespace backend.Modules.Event.Contracts;

public record SaleWindowResponse(
    Guid Id,
    string Label,
    bool Open,
    DateTime OpensAt,
    DateTime ClosesAt,
    int Cap,
    int Remaining);

public record EventPhaseSnapshot(
    bool SalesOpen,
    bool RedemptionOpen,
    string Phase,
    ForcedPhase ForcedPhase,
    DateTime SalesOpenAt,
    DateTime SalesCloseAt,
    DateTime RedemptionOpensAt,
    DateTime ServerTime,
    IReadOnlyList<SaleWindowResponse> SaleWindows);
