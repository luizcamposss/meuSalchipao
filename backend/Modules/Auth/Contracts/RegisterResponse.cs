using backend.Modules.Auth.Domain;

namespace backend.Modules.Auth.Contracts;

public record RegisterResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Enrollment { get; set; } = null!;
    public Shift Shift { get; set; }
    public Role Role { get; set; }
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
}