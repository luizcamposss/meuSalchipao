using System.Text.Json;
using backend.Modules.Payments.Gateway;
using backend.Modules.Payments.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Payments.Endpoints;

[ApiController]
[Route("webhooks/mercadopago")]
[AllowAnonymous]
public class WebhookController: ControllerBase
{
    private readonly MercadoPagoSignatureValidator _signatures;
    private readonly IPaymentService _paymentService;
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    public WebhookController(MercadoPagoSignatureValidator signatures, IPaymentService paymentService)
    {
        _signatures = signatures;
        _paymentService = paymentService;
    }

    [HttpPost]
    public async Task<IActionResult> Handle(CancellationToken ct)
    {
        var queryDataId = Request.Query["data.id"].FirstOrDefault()
                          ?? Request.Query["id"].FirstOrDefault();

        var xSignature =  Request.Headers["x-signature"].FirstOrDefault();
        var xRequestId = Request.Headers["x-request-id"].FirstOrDefault();

        if (!_signatures.Validate(xSignature, xRequestId, queryDataId))
            return Unauthorized();

        using var reader = new StreamReader(Request.Body);
        var raw = await reader.ReadToEndAsync(ct);
        var notif = JsonSerializer.Deserialize<MpWebhookNotification>(raw, Json);

        if (notif is null)
            return Ok();

        if (notif.Type is not "payment")
            return Ok();

        var dataId = notif.Data?.Id ?? queryDataId;
        if (string.IsNullOrEmpty(dataId))
            return Ok();

        await _paymentService.HandlePaymentNotificationAsync(dataId, notif.Id.ToString(), notif.Action, ct);
        return Ok();
    }
}
