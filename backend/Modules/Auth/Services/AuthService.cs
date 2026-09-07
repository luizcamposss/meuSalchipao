using System.ComponentModel.DataAnnotations;
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
    private readonly AppDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IMapper _mapper;

    public AuthService(AppDbContext context, IPasswordHasher<User> passwordHasher, IMapper mapper)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _mapper = mapper;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest registerRequest, CancellationToken ct)
    {
        try
        {
            if (registerRequest.Shift == Shift.Undefined)
                throw new ValidationException("Shift is required.");

            var emailExists = await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u => u.Email == registerRequest.Email, ct);

            if (emailExists)
            {
                throw new ConflictException("Email already registered.");
            }

            var enrollmentExists = await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u => u.Enrollment == registerRequest.Enrollment, ct);

            if (enrollmentExists)
            {
                throw new ConflictException("Registration number already registered.");
            }

            User user = new User
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
            await _context.SaveChangesAsync(ct);
            return _mapper.Map<RegisterResponse>(user);

        }
        catch (DbUpdateException ex) when (ex.InnerException is MySqlException mysqlEx && mysqlEx.Number == 1062)
        {
            throw new ConflictException("Email or registration number already registered.");
        }
    }
}