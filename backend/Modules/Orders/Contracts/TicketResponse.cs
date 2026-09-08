using backend.Modules.Orders.Domain;

namespace backend.Modules.Orders.Contracts;
public record TicketResponse(
    Guid OrderId,
    OrderStatus Status,
    decimal Total,
    DateTime CreatedAt,
    DateTime? RedeemedAt,
    int? PickupNumber,
    string QrValue,
    List<OrderItemResponse> Items);
