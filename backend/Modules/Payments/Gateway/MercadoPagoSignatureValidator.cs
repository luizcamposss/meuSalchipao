using System.Security.Cryptography;
using System.Text;

namespace backend.Modules.Payments.Gateway;
public class MercadoPagoSignatureValidator(IConfiguration config)
{
    public bool Validate(string? xSignature, string? xRequestId, string? dataId)
    {
        if (string.IsNullOrWhiteSpace(xSignature))
            return false;

        string? ts = null, v1 = null;
        foreach (var part in xSignature.Split(','))
        {
            var kv = part.Split('=', 2);
            if (kv.Length != 2) continue;
            var key = kv[0].Trim();
            var value = kv[1].Trim();
            if (key == "ts") ts = value;
            else if (key == "v1") v1 = value;
        }

        if (ts is null || v1 is null)
            return false;

        var manifest = new StringBuilder();
        if (!string.IsNullOrEmpty(dataId))
            manifest.Append($"id:{dataId.ToLowerInvariant()};");
        if (!string.IsNullOrEmpty(xRequestId))
            manifest.Append($"request-id:{xRequestId};");
        manifest.Append($"ts:{ts};");

        var secret = config["MercadoPago:WebhookSecret"]
            ?? throw new InvalidOperationException("MercadoPago:WebhookSecret not configured");

        var computed = Convert.ToHexString(
                HMACSHA256.HashData(
                    Encoding.UTF8.GetBytes(secret),
                    Encoding.UTF8.GetBytes(manifest.ToString())))
            .ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed),
            Encoding.UTF8.GetBytes(v1));
    }
}
