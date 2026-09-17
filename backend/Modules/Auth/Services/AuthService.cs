using System.ComponentModel.DataAnnotations;
using System.Security.Authentication;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using backend.Modules.Auth.Contracts;
using backend.Modules.Auth.Domain;
using backend.Shared.Exceptions;
using backend.Shared.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace backend.Modules.Auth.Services;

public class AuthService : IAuthService
{
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(30);

    private readonly AppDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IJwtTokenService _jwt;
    private readonly IMapper _mapper;

    public AuthService(
        AppDbContext context,
        IPasswordHasher<User> passwordHasher,
        IJwtTokenService jwt,
        IMapper mapper)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwt = jwt;
        _mapper = mapper;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest registerRequest, CancellationToken ct)
    {
        if (registerRequest.Shift == Shift.Undefined)
            throw new ValidationException("Shift is required.");

        var emailExists = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email == registerRequest.Email, ct);

        if (emailExists)
            throw new ConflictException("Email already registered.");

        var enrollmentExists = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Enrollment == registerRequest.Enrollment, ct);

        if (enrollmentExists)
            throw new ConflictException("Registration number already registered.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = registerRequest.Name,
            Email = registerRequest.Email,
            Enrollment = registerRequest.Enrollment,
            Shift = registerRequest.Shift,
            Role = Role.Student,
            Active = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, registerRequest.Password);

        _context.Add(user);

        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is MySqlException { Number: 1062 })
        {
            throw new ConflictException("Email or registration number already registered.");
        }

        return _mapper.Map<RegisterResponse>(user);
    }

    public async Task<LoginResult> LoginAsync(LoginRequest loginRequest, CancellationToken ct)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == loginRequest.Email, ct);

        var passwordOk = user is not null 
            && _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, loginRequest.Password)
               != PasswordVerificationResult.Failed;

        if (user is null || !user.Active || !passwordOk)
            throw new AuthenticationException("Invalid email or password.");

        var accessToken = _jwt.CreateAccessToken(user);

        var refreshToken = GenerateRefreshToken();

        _context.Add(new Session
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = HashToken(refreshToken),
            CreatedAt = DateTime.UtcNow,
            LastUsedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.Add(RefreshTokenLifetime),
        });
        await _context.SaveChangesAsync(ct);

        return new LoginResult(accessToken, refreshToken, _mapper.Map<LoginResponse>(user));
    }

    public async Task<LoginResult> RefreshAsync(string refreshToken, CancellationToken ct)
    {
        var hash = HashToken(refreshToken);

        var session = await _context.Sessions
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.TokenHash == hash, ct);

        if (session is null || session.ExpiresAt <= DateTime.UtcNow || !session.User.Active)
            throw new AuthenticationException("Invalid or expired session.");

        var newRefreshToken = GenerateRefreshToken();

        _context.Sessions.Remove(session);
        _context.Add(new Session
        {
            Id = Guid.NewGuid(),
            UserId = session.UserId,
            TokenHash = HashToken(newRefreshToken),
            CreatedAt = DateTime.UtcNow,
            LastUsedAt = DateTime.UtcNow,
            ExpiresAt = session.ExpiresAt,
        });
        await _context.SaveChangesAsync(ct);

        var accessToken = _jwt.CreateAccessToken(session.User);

        return new LoginResult(accessToken, newRefreshToken, _mapper.Map<LoginResponse>(session.User));
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct)
    {
        var hash = HashToken(refreshToken);

        var session = await _context.Sessions
            .FirstOrDefaultAsync(s => s.TokenHash == hash, ct);

        if (session is null)
            return;

        _context.Sessions.Remove(session);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<MeResponse?> GetMeAsync(Guid userId, CancellationToken ct)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        return user is null
            ? null
            : new MeResponse(user.Id, user.Name, user.Email, user.Enrollment, user.Shift, user.Role);
    }

    public async Task<StaffResetPasswordResponse> ResetPasswordAsync(StaffResetPasswordRequest request, CancellationToken ct)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, ct);

        if (user is null)
            throw new NotFoundException("No user found with this email.");

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        // Derruba as sessões existentes: a senha antiga não deve continuar
        // valendo pra sessões já abertas depois de um reset feito pelo staff.
        var sessions = await _context.Sessions
            .Where(s => s.UserId == user.Id)
            .ToListAsync(ct);
        _context.Sessions.RemoveRange(sessions);

        await _context.SaveChangesAsync(ct);

        return new StaffResetPasswordResponse(user.Id, user.Name, user.Email, user.Enrollment);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private static string HashToken(string token)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)))
            .ToLowerInvariant();
}
