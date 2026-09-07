using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Shared.Exceptions;

namespace backend.Modules.Payments.Gateway;

public class MercadoPagoClient(HttpClient http)
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,          
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
    public async Task<MpPayment> CreatePixPaymentAsync(
        CreatePixPaymentRequest request, string idempotencyKey, CancellationToken ct)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, "/v1/payments")
        {
            Content = JsonContent.Create(request, options: Json),
        };
        message.Headers.Add("X-Idempotency-Key", idempotencyKey);

        using var response = await http.SendAsync(message, ct);
        return await ReadOrThrowAsync(response, ct);
    }
    public async Task<MpPayment> GetPaymentAsync(string externalId, CancellationToken ct)
    {
        using var response = await http.GetAsync($"/v1/payments/{externalId}", ct);
        return await ReadOrThrowAsync(response, ct);
    }

    private static async Task<MpPayment> ReadOrThrowAsync(HttpResponseMessage response, CancellationToken ct)
    {
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            throw new MercadoPagoException($"MP {(int)response.StatusCode}: {body}");

        return JsonSerializer.Deserialize<MpPayment>(body, Json)
            ?? throw new MercadoPagoException($"MP {(int)response.StatusCode}: empty body");
    }
}
