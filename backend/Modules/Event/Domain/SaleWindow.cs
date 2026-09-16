namespace backend.Modules.Event.Domain;

public class SaleWindow
{
    public Guid Id { get; set; }
    public Guid EventSettingsId { get; set; }
    public string Label { get; set; } = null!;
    public DateTime OpensAt { get; set; }
    public DateTime ClosesAt { get; set; }
    public int Cap { get; set; }
    public int Count { get; set; }
}
