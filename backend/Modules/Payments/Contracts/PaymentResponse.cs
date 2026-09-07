using backend.Modules.Orders.Domain;

namespace backend.Modules.Payments.Contracts;

// Returned by POST /orders/{id}/payment and GET /payments/{id}.
// The client renders PixCode / PixQrCodeBase64 and polls GET /payments/{id}
// until Status becomes Approved.
public record PaymentResponse(
    Guid PaymentId,
    PaymentStatus Status,
    string? PixCode,
    string? PixQrCodeBase64,
    DateTime ExpiresAt,
    decimal Amount);
