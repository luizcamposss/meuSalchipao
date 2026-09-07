using backend.Modules.Auth.Domain;

namespace backend.Modules.Auth.Contracts;
public record LoginResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = null!;
    public string Email { get; init; } = null!;
    public Role Role { get; init; }
    public Shift Shift { get; init; }
}
