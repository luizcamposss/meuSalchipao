using backend.Modules.Auth.Contracts;
using backend.Modules.Auth.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Auth.Endpoints
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<RegisterResponse>> Register(
            [FromBody] RegisterRequest request,
            CancellationToken ct)
        {
            var user = await _authService.RegisterAsync(request, ct);
             return Created($"/auth/users/{user.Id}", user);
        }
    }
}