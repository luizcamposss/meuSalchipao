using System.ComponentModel.DataAnnotations;

namespace backend.Modules.Event.Contracts;

public record CreateSaleWindowRequest
{
    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Label { get; init; } = null!;

    public DateTime OpensAt { get; init; }
    public DateTime ClosesAt { get; init; }

    [Range(1, int.MaxValue)]
    public int Cap { get; init; }
}

public record UpdateSaleWindowRequest
{
    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Label { get; init; } = null!;

    public DateTime OpensAt { get; init; }
    public DateTime ClosesAt { get; init; }

    [Range(1, int.MaxValue)]
    public int Cap { get; init; }
}
