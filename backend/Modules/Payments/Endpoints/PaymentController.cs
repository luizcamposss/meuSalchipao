using System.Security.Claims;
using backend.Modules.Payments.Contracts;
using backend.Modules.Payments.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Payments.Endpoints;

[ApiController]
[Authorize]
public class PaymentController(IPaymentService payments) : ControllerBase
{
    // Create (or return the live) Pix charge for an order.
    [HttpPost("orders/{orderId:guid}/payment")]
    public async Task<ActionResult<PaymentResponse>> Create(Guid orderId, CancellationToken ct)
    {
        var result = await payments.CreateForOrderAsync(orderId, CurrentUserId, ct);
        return CreatedAtAction(nameof(Get), new { id = result.PaymentId }, result);
    }

    // The client polls this until Status is Approved.
    [HttpGet("payments/{id:guid}")]
    public async Task<ActionResult<PaymentResponse>> Get(Guid id, CancellationToken ct)
    {
        var result = await payments.GetForUserAsync(id, CurrentUserId, IsStaff, ct);
        return result is null ? NotFound() : Ok(result);
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("sub")!);
    private bool IsStaff => User.IsInRole("Staff");
}
