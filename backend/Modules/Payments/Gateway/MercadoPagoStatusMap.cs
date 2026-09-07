using backend.Modules.Orders.Domain;

namespace backend.Modules.Payments.Gateway;
public static class MercadoPagoStatusMap
{
    public static PaymentStatus ToPaymentStatus(string mpStatus) => mpStatus switch
    {
        "approved" => PaymentStatus.Approved,
        "refunded" or "charged_back" => PaymentStatus.Refunded,
        "rejected" or "cancelled" => PaymentStatus.Rejected,
        "expired" => PaymentStatus.Expired,
        _ => PaymentStatus.Pending,
    };
}
