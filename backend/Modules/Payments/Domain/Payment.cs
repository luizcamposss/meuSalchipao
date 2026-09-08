using backend.Modules.Orders.Domain;

namespace backend.Modules.Payments.Domain;

public class Payment
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string Provider { get; set; } = null!;
    public string? ExternalId { get; set; }
    public PaymentStatus Status { get; set; }
    public string? StatusDetail { get; set; }
    public decimal Amount { get; set; }
    public string? PixCode { get; set; }
    public string? PixQrCodeBase64 { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? LastWebhookAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}