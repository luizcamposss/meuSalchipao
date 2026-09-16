using System.Security.Claims;
using backend.Modules.Event.Contracts;
using backend.Modules.Event.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Event.Endpoints;

[ApiController]
[Route("event")]
public class EventController : ControllerBase
{
    private readonly IEventPhaseService _eventService;

    public EventController(IEventPhaseService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<EventPhaseSnapshot>> Get(CancellationToken ct)
    {
        return Ok(await _eventService.GetSnapshotAsync(ct));
    }

    [HttpPut]
    [Authorize(Roles = "Staff")]
    public async Task<ActionResult<EventPhaseSnapshot>> Update(UpdateEventRequest request, CancellationToken ct)
    {
        var staffId = Guid.Parse(User.FindFirstValue("sub")!);
        return Ok(await _eventService.UpdateAsync(request, staffId, ct));
    }

    [HttpPost("sale-windows")]
    [Authorize(Roles = "Staff")]
    public async Task<ActionResult<SaleWindowResponse>> CreateSaleWindow(CreateSaleWindowRequest request, CancellationToken ct)
    {
        return Ok(await _eventService.CreateSaleWindowAsync(request, ct));
    }

    [HttpPut("sale-windows/{id:guid}")]
    [Authorize(Roles = "Staff")]
    public async Task<ActionResult<SaleWindowResponse>> UpdateSaleWindow(Guid id, UpdateSaleWindowRequest request, CancellationToken ct)
    {
        return Ok(await _eventService.UpdateSaleWindowAsync(id, request, ct));
    }

    [HttpDelete("sale-windows/{id:guid}")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> DeleteSaleWindow(Guid id, CancellationToken ct)
    {
        await _eventService.DeleteSaleWindowAsync(id, ct);
        return NoContent();
    }
}
