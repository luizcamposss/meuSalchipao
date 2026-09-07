using System.Text;
using backend.Modules.Auth.Domain;
using backend.Modules.Auth.Mapping;
using backend.Modules.Auth.Services;
using backend.Modules.Catalog.Services;
using backend.Modules.Event.Services;
using backend.Modules.Orders.Services;
using backend.Shared.Exceptions;
using backend.Shared.Persistence;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' not configured");
}

builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 4, 0))
    ));

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAutoMapper(
    cfg => cfg.AddMaps(typeof(AuthMappingProfile).Assembly));

builder.Services.AddSingleton(TimeProvider.System);

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<IEventPhaseService, EventPhaseService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SigningKey"]!)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                if (ctx.Request.Cookies.TryGetValue("access_token", out var token))
                    ctx.Token = token;
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
