using backend.Modules.Auth.Contracts;

namespace backend.Modules.Auth.Services;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest registerRequest, CancellationToken ct);

    Task<LoginResult> LoginAsync(LoginRequest loginRequest, CancellationToken ct);

    Task<LoginResult> RefreshAsync(string refreshToken, CancellationToken ct);

    Task LogoutAsync(string refreshToken, CancellationToken ct);
}
