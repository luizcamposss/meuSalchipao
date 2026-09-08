using backend.Modules.Event.Domain;

namespace backend.Modules.Event.Contracts;

public record EventPhaseSnapshot(
    bool SalesOpen,
    bool RedemptionOpen,
    string Phase,
    ForcedPhase ForcedPhase,
    DateTime SalesOpenAt,
    DateTime SalesCloseAt,
    DateTime RedemptionOpensAt,
    DateTime ServerTime);
