using System.Security.Claims;
using backend.Modules.Auth.Contracts;
using backend.Modules.Auth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Auth.Endpoints;

[ApiController]
[Route("auth")]
public class AuthController(IAuthService authService, IHostEnvironment env) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register(RegisterRequest request, CancellationToken ct)
    {
        var user = await authService.RegisterAsync(request, ct);
        return Created($"/auth/users/{user.Id}", user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await authService.LoginAsync(request, ct);
        SetAuthCookies(result.AccessToken, result.RefreshToken);
        return Ok(result.User);
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult Me() => Ok(new
    {
        id = User.FindFirstValue("sub"),
        name = User.FindFirstValue("name"),
        role = User.FindFirstValue(ClaimTypes.Role),
    });
    private void SetAuthCookies(string accessToken, string refreshToken)
    {
        var secure = !env.IsDevelopment();

        Response.Cookies.Append("access_token", accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = SameSiteMode.Lax,
            MaxAge = TimeSpan.FromMinutes(15),
        });

        Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = SameSiteMode.Lax,
            Path = "/auth/refresh",
            MaxAge = TimeSpan.FromDays(30),
        });
    }
}
