using backend.Modules.Auth.Contracts;

namespace backend.Modules.Auth.Services;

public record LoginResult(string AccessToken, string RefreshToken, LoginResponse User);
