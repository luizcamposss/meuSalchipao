namespace backend.Modules.Event.Contracts;

public record EventPhaseSnapshot(
    bool SalesOpen,
    bool RedemptionOpen,
    string Phase,
    DateTime SalesOpenAt,
    DateTime SalesCloseAt,
    DateTime RedemptionOpensAt,
    DateTime ServerTime);
