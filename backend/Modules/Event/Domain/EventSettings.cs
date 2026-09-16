namespace backend.Modules.Event.Domain;

public class EventSettings
{
    public Guid Id { get; set; }
    public DateTime SalesOpenAt { get; set; }
    public DateTime SalesCloseAt { get; set; }
    public DateTime RedemptionOpensAt { get; set; }
    public ForcedPhase ForcedPhase { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public List<SaleWindow> SaleWindows { get; set; } = [];
}