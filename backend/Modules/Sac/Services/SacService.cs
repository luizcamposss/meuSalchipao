using System.ComponentModel.DataAnnotations;
using AutoMapper;
using backend.Modules.Sac.Contracts;
using backend.Modules.Sac.Domain;
using backend.Shared.Exceptions;
using backend.Shared.Persistence;
using Microsoft.EntityFrameworkCore;

namespace backend.Modules.Sac.Services;

public class SacService : ISacService
{
    private readonly AppDbContext _context;
    private readonly TimeProvider clock;
    private readonly IMapper _mapper;

    public SacService(AppDbContext context, TimeProvider clock, IMapper mapper)
    {
        _context = context;
        this.clock = clock;
        _mapper = mapper;
    }

    public async Task<SacTicketResponse> CreateTicketAsync(Guid userId, CreateTicketRequest req, CancellationToken ct)
    {
        if (req.OrderId is { } orderId)
        {
            var ownsOrder = await _context.Orders.AnyAsync(o => o.Id == orderId && o.UserId == userId, ct);
            if (!ownsOrder)
                throw new ValidationException("Order not found for this user.");
        }

        var now = clock.GetUtcNow().UtcDateTime;
        var ticket = new SacTicket
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OrderId = req.OrderId,
            Subject = req.Subject,
            Description = req.Description,
            Status = SacTicketStatus.Open,
            Priority = SacTicketPriority.Normal,
            CreatedAt = now,
            UpdatedAt = now,
        };

        _context.Add(ticket);
        await _context.SaveChangesAsync(ct);
        return _mapper.Map<SacTicketResponse>(ticket);
    }

    public async Task<IReadOnlyList<SacTicketResponse>> GetMineAsync(Guid userId, CancellationToken ct)
    {
        var tickets = await _context.SacTickets
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync(ct);

        return _mapper.Map<List<SacTicketResponse>>(tickets);
    }

    public async Task<IReadOnlyList<SacTicketResponse>> GetAllAsync(SacTicketStatus? status, CancellationToken ct)
    {
        var query = _context.SacTickets.AsNoTracking();
        if (status is { } s)
            query = query.Where(t => t.Status == s);

        var tickets = await query
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.CreatedAt)
            .ToListAsync(ct);

        return _mapper.Map<List<SacTicketResponse>>(tickets);
    }

    public async Task<SacTicketResponse?> GetByIdAsync(Guid ticketId, Guid userId, bool isStaff, CancellationToken ct)
    {
        var ticket = await _context.SacTickets
            .AsNoTracking()
            .Include(t => t.Messages.OrderBy(m => m.CreatedAt))
            .FirstOrDefaultAsync(t => t.Id == ticketId, ct);

        if (ticket is null)
            return null;

        if (!isStaff && ticket.UserId != userId)
            return null;

        return _mapper.Map<SacTicketResponse>(ticket);
    }

    public async Task<SacMessageResponse> AddMessageAsync(
        Guid ticketId, Guid senderId, bool isStaff, AddMessageRequest req, CancellationToken ct)
    {
        var ticket = await _context.SacTickets.FirstOrDefaultAsync(t => t.Id == ticketId, ct);

        if (ticket is null || (!isStaff && ticket.UserId != senderId))
            throw new NotFoundException("Ticket not found.");

        if (ticket.Status == SacTicketStatus.Closed)
            throw new ConflictException("Ticket is closed.");

        var now = clock.GetUtcNow().UtcDateTime;

        var message = new SacMessage
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            SenderId = senderId,
            FromStaff = isStaff,
            Message = req.Message,
            CreatedAt = now,
        };
        _context.Add(message);

        if (isStaff && ticket.Status == SacTicketStatus.Open)
            ticket.Status = SacTicketStatus.InProgress;
        else if (!isStaff && ticket.Status == SacTicketStatus.Resolved)
            ticket.Status = SacTicketStatus.Open;

        ticket.UpdatedAt = now;

        await _context.SaveChangesAsync(ct);
        return _mapper.Map<SacMessageResponse>(message);
    }

    public async Task<SacTicketResponse> UpdateAsync(Guid ticketId, UpdateTicketRequest req, CancellationToken ct)
    {
        var ticket = await _context.SacTickets
            .Include(t => t.Messages.OrderBy(m => m.CreatedAt))
            .FirstOrDefaultAsync(t => t.Id == ticketId, ct);

        if (ticket is null)
            throw new NotFoundException("Ticket not found.");

        if (req.Status is { } s)
            ticket.Status = s;
        if (req.Priority is { } p)
            ticket.Priority = p;

        ticket.UpdatedAt = clock.GetUtcNow().UtcDateTime;

        await _context.SaveChangesAsync(ct);
        return _mapper.Map<SacTicketResponse>(ticket);
    }
}
