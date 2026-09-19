namespace backend.Modules.Orders.Domain;

public class Order
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public decimal Total { get; set; }
    public OrderStatus Status { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? RedeemedAt { get; set; }
    public Guid? RedeemedBy { get; set; }

    public int? PickupNumber { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
