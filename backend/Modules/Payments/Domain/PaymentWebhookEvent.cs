namespace backend.Modules.Payments.Domain;

public class PaymentWebhookEvent
{
    public Guid Id { get; set; }
    public string EventId { get; set; } = null!;
    public string PaymentId { get; set; } = null!;
    public string Action { get; set; } = null!;
    public DateTime ProcessedAt { get; set; }
}