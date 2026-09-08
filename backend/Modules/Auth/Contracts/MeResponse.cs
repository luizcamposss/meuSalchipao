using backend.Modules.Auth.Domain;

namespace backend.Modules.Auth.Contracts;

public record MeResponse(
    Guid Id,
    string Name,
    string Email,
    string Enrollment,
    Shift Shift,
    Role Role);
