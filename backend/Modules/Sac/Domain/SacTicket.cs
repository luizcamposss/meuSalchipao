namespace backend.Modules.Sac.Domain;

public class SacTicket
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? OrderId { get; set; } 
    public string Subject { get; set; } = null!;
    public string Description { get; set; } = null!;
    public SacTicketStatus Status { get; set; }
    public SacTicketPriority Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<SacMessage> Messages { get; set; } = new List<SacMessage>();
}
