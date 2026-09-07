using System.ComponentModel.DataAnnotations;

namespace backend.Modules.Orders.Contracts;

public record CreateOrderRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "An order must have at least one item.")]
    public List<CreateOrderItem> Items { get; init; } = [];
}

public record CreateOrderItem
{
    [Required]
    public Guid ProductId { get; init; }

    [Range(1, 100, ErrorMessage = "Quantity must be between 1 and 100.")]
    public int Quantity { get; init; }
}
