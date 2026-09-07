using backend.Modules.Orders.Domain;

namespace backend.Modules.Orders.Contracts;

public record OrderResponse
{
    public Guid Id { get; init; }
    public decimal Total { get; init; }
    public OrderStatus Status { get; init; }
    public PaymentStatus PaymentStatus { get; init; }
    public DateTime CreatedAt { get; init; }
    public List<OrderItemResponse> Items { get; init; } = [];
}

public record OrderItemResponse
{
    public Guid ProductId { get; init; }
    public string ProductName { get; init; } = null!;
    public decimal UnitPrice { get; init; }
    public int Quantity { get; init; }
}
