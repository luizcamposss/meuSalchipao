using backend.Modules.Payments.Contracts;

namespace backend.Modules.Payments.Services;

public interface IPaymentService
{
    Task<PaymentResponse> CreateForOrderAsync(Guid orderId, Guid userId, CancellationToken ct);
    Task<PaymentResponse?> GetForUserAsync(Guid paymentId, Guid userId, bool isStaff, CancellationToken ct);
    Task HandlePaymentNotificationAsync(string dataId, string notificationId, string? action, CancellationToken ct);
}
