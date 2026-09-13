namespace backend.Modules.Event.Domain;

public class EventSettings
{
    public Guid Id { get; set; }
    public DateTime SalesOpenAt { get; set; }
    public DateTime SalesCloseAt { get; set; }
    public DateTime RedemptionOpensAt { get; set; }
    public ForcedPhase ForcedPhase { get; set; }
    public DateTime MorningSaleOpensAt { get; set; }
    public DateTime MorningSaleClosesAt { get; set; }
    public int MorningSaleCap { get; set; }
    public int MorningSaleCount { get; set; }
    public DateTime AfternoonSaleOpensAt { get; set; }
    public DateTime AfternoonSaleClosesAt { get; set; }
    public int AfternoonSaleCap { get; set; }
    public int AfternoonSaleCount { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}