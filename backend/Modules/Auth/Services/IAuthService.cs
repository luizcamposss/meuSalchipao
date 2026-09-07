using backend.Modules.Auth.Contracts;

namespace backend.Modules.Auth.Services;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest registerRequest, CancellationToken ct);
}