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

    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponse>> Refresh(CancellationToken ct)
    {
        if (!Request.Cookies.TryGetValue("refresh_token", out var refreshToken)
            || string.IsNullOrEmpty(refreshToken))
        {
            ClearAuthCookies();
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Missing refresh token.");
        }

        try
        {
            var result = await authService.RefreshAsync(refreshToken, ct);
            SetAuthCookies(result.AccessToken, result.RefreshToken);
            return Ok(result.User);
        }
        catch (System.Security.Authentication.AuthenticationException ex)
        {
            ClearAuthCookies();
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: ex.Message);
        }
    }
    
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        if (Request.Cookies.TryGetValue("refresh_token", out var refreshToken)
            && !string.IsNullOrEmpty(refreshToken))
        {
            await authService.LogoutAsync(refreshToken, ct);
        }

        ClearAuthCookies();
        return NoContent();
    }

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
    private void ClearAuthCookies()
    {
        Response.Cookies.Delete("access_token", new CookieOptions { Path = "/" });
        Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/auth/refresh" });
    }
}
