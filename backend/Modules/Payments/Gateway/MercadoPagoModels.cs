namespace backend.Modules.Payments.Gateway;

public record CreatePixPaymentRequest(
    decimal TransactionAmount,
    string PaymentMethodId,     
    string Description,
    string ExternalReference,   
    string NotificationUrl,     
    string DateOfExpiration,    
    MpPayer Payer);

public record MpPayer(string Email, string? FirstName = null);

public record MpPayment(
    long Id,                    
    string Status,            
    string? StatusDetail,
    DateTimeOffset? DateApproved,
    decimal TransactionAmount,
    MpPointOfInteraction? PointOfInteraction);

public record MpPointOfInteraction(MpTransactionData? TransactionData);
public record MpTransactionData(string? QrCode, string? QrCodeBase64);
