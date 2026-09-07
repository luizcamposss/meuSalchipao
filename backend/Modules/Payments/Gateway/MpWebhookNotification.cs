using System.Text.Json.Serialization;

namespace backend.Modules.Payments.Gateway;
public record MpWebhookNotification(
    [property: JsonPropertyName("id")] long Id,  
    [property: JsonPropertyName("type")] string? Type, 
    [property: JsonPropertyName("action")] string? Action,
    [property: JsonPropertyName("data")] MpWebhookData? Data);

public record MpWebhookData([property: JsonPropertyName("id")] string? Id);
