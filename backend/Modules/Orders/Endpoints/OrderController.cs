using System.Security.Claims;
using backend.Modules.Orders.Contracts;
using backend.Modules.Orders.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Orders.Endpoints;

[ApiController]
[Route("orders")]
[Authorize]
public class OrderController(IOrderService orders) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<OrderResponse>> Create(CreateOrderRequest request, CancellationToken ct)
    {
        var order = await orders.CreateOrderAsync(CurrentUserId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderResponse>>> GetMine(CancellationToken ct)
    {
        return Ok(await orders.GetMineAsync(CurrentUserId, ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderResponse>> GetById(Guid id, CancellationToken ct)
    {
        var order = await orders.GetByIdAsync(id, CurrentUserId, IsStaff, ct);
        return order is null ? NotFound() : Ok(order);
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("sub")!);
    private bool IsStaff => User.IsInRole("Staff");
}
