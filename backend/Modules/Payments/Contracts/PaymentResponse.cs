using backend.Modules.Orders.Domain;

namespace backend.Modules.Payments.Contracts;

public record PaymentResponse(
    Guid PaymentId,
    PaymentStatus Status,
    string? PixCode,
    string? PixQrCodeBase64,
    DateTime ExpiresAt,
    decimal Amount);
