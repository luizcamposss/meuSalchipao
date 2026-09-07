namespace backend.Modules.Orders.Domain;

public enum OrderStatus
{
    AwaitingPayment = 1,
    Paid = 2,
    Redeemed = 3,
    Cancelled = 4,
}
