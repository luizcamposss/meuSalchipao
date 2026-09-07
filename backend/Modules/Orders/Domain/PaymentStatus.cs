namespace backend.Modules.Orders.Domain;
public enum PaymentStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Expired = 4,
    Refunded = 5,
}
