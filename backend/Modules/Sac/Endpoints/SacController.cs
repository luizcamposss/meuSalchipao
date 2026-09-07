using System.Security.Claims;
using backend.Modules.Sac.Contracts;
using backend.Modules.Sac.Domain;
using backend.Modules.Sac.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Sac.Endpoints;

[ApiController]
[Route("sac/tickets")]
[Authorize]
public class SacController(ISacService sac) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<SacTicketResponse>> Create(CreateTicketRequest req, CancellationToken ct)
    {
        var ticket = await sac.CreateTicketAsync(CurrentUserId, req, ct);
        return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, ticket);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SacTicketResponse>>> GetMine(CancellationToken ct)
    {
        return Ok(await sac.GetMineAsync(CurrentUserId, ct));
    }

    [HttpGet("all")]
    [Authorize(Roles = "Staff")]
    public async Task<ActionResult<IReadOnlyList<SacTicketResponse>>> GetAll(
        [FromQuery] SacTicketStatus? status, CancellationToken ct)
        => Ok(await sac.GetAllAsync(status, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SacTicketResponse>> GetById(Guid id, CancellationToken ct)
    {
        var ticket = await sac.GetByIdAsync(id, CurrentUserId, IsStaff, ct);
        return ticket is null ? NotFound() : Ok(ticket);
    }

    [HttpPost("{id:guid}/messages")]
    public async Task<ActionResult<SacMessageResponse>> AddMessage(
        Guid id, AddMessageRequest req, CancellationToken ct)
    {
        return Ok(await sac.AddMessageAsync(id, CurrentUserId, IsStaff, req, ct));
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "Staff")]
    public async Task<ActionResult<SacTicketResponse>> Update(
        Guid id, UpdateTicketRequest req, CancellationToken ct)
    {
        return Ok(await sac.UpdateAsync(id, req, ct));
    }
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("sub")!);
    private bool IsStaff => User.IsInRole("Staff");
}
