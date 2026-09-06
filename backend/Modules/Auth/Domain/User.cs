namespace backend.Modules.Auth.Domain;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Enrollment { get; set; } = null!;
    public Shift Shift { get; set; }
    public string PasswordHash { get; set; } = null!;
    public Role Role { get; set; }
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
