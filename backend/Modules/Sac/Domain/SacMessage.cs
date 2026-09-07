namespace backend.Modules.Sac.Domain;

public class SacMessage
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public SacTicket Ticket { get; set; } = null!;
    public Guid SenderId { get; set; }
    public bool FromStaff { get; set; }
    public string Message { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
