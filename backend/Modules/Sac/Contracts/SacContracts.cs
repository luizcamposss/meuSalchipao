using System.ComponentModel.DataAnnotations;
using backend.Modules.Sac.Domain;

namespace backend.Modules.Sac.Contracts;

public record CreateTicketRequest
{
    [Required]
    [StringLength(150, MinimumLength = 3)]
    public string Subject { get; init; } = null!;

    [Required]
    [StringLength(4000, MinimumLength = 5)]
    public string Description { get; init; } = null!;

    public Guid? OrderId { get; init; }
}

public record AddMessageRequest
{
    [Required]
    [StringLength(4000, MinimumLength = 1)]
    public string Message { get; init; } = null!;
}
public record UpdateTicketRequest
{
    public SacTicketStatus? Status { get; init; }
    public SacTicketPriority? Priority { get; init; }
}

public record SacMessageResponse(
    Guid Id, Guid SenderId, bool FromStaff, string Message, DateTime CreatedAt);

public record SacTicketResponse(
    Guid Id,
    Guid UserId,
    Guid? OrderId,
    string Subject,
    string Description,
    SacTicketStatus Status,
    SacTicketPriority Priority,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<SacMessageResponse> Messages)
{
    /// <summary>Dados do aluno que abriu o chamado (preenchido no GET por id e na fila).</summary>
    public string? UserName { get; init; }
    public string? UserEmail { get; init; }
    public string? UserEnrollment { get; init; }
}
