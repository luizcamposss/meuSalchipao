namespace backend.Modules.Auth.Contracts;

public record StaffResetPasswordResponse(
    Guid Id,
    string Name,
    string Email,
    string Enrollment);
