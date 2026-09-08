using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using backend.Modules.Auth.Domain;
using backend.Modules.Auth.Mapping;
using backend.Modules.Auth.Services;
using backend.Modules.Catalog.Services;
using backend.Modules.Event.Services;
using backend.Modules.Orders.Services;
using backend.Modules.Sac.Services;
using backend.Modules.Payments.BackgroundJobs;
using backend.Modules.Payments.Gateway;
using backend.Modules.Payments.Services;
using backend.Shared.Exceptions;
using backend.Shared.Persistence;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
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

builder.Services
    .AddControllers()
    .AddJsonOptions(o =>
        // Serialize/accept enums as their names ("Student", "Pending") instead of ints.
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

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
builder.Services.AddScoped<IRedemptionService, RedemptionService>();
builder.Services.AddScoped<ISacService, SacService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<MercadoPagoSignatureValidator>();
builder.Services.AddHostedService<SalesCutoffWorker>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.AddHttpClient<MercadoPagoClient>(c =>
{
    c.BaseAddress = new Uri("https://api.mercadopago.com");
    c.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", builder.Configuration["MercadoPago:AccessToken"]);
})
.AddStandardResilienceHandler();

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

// Atrás do Caddy (rede interna do compose) o IP/scheme reais vêm nos headers
// X-Forwarded-*. Sem isto o rate-limit por IP veria só o IP do proxy.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // a API só é alcançável pelo Caddy; confiamos em qualquer proxy da rede interna
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});

var corsOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(corsOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("auth", http =>
        RateLimitPartition.GetFixedWindowLimiter(
            http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));

    options.AddPolicy("payment", http =>
        RateLimitPartition.GetFixedWindowLimiter(
            http.User.FindFirstValue("sub")
                ?? http.Connection.RemoteIpAddress?.ToString()
                ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Staff de bootstrap. Cada perfil é semeado só se o e-mail ainda não existir,
    // então funciona tanto num banco novo quanto num que já tinha o staff antigo.
    // Trocar as senhas depois do primeiro login (ver README).
    var seedStaff = new[]
    {
        (Name: "Equipe Salchipão", Email: "staff@salchipao.com", Enrollment: "STAFF001", Shift: Shift.Morning, Password: "staff01!"),
        (Name: "Equipe Salchipão · Tarde", Email: "staff2@salchipao.com", Enrollment: "STAFF002", Shift: Shift.Afternoon, Password: "staff02!"),
        (Name: "Equipe Salchipão · Noite", Email: "staff3@salchipao.com", Enrollment: "STAFF003", Shift: Shift.Evening, Password: "staff03!"),
    };

    var staffEmails = seedStaff.Select(s => s.Email).ToArray();
    var existingStaffEmails = db.Users
        .Where(u => staffEmails.Contains(u.Email))
        .Select(u => u.Email)
        .ToHashSet();

    if (existingStaffEmails.Count < seedStaff.Length)
    {
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        foreach (var s in seedStaff)
        {
            if (existingStaffEmails.Contains(s.Email))
                continue;

            var now = DateTime.UtcNow;
            var staff = new User
            {
                Id = Guid.NewGuid(),
                Name = s.Name,
                Email = s.Email,
                Enrollment = s.Enrollment,
                Shift = s.Shift,
                Role = Role.Staff,
                Active = true,
                CreatedAt = now,
                UpdatedAt = now,
            };
            staff.PasswordHash = hasher.HashPassword(staff, s.Password);
            db.Users.Add(staff);
            app.Logger.LogInformation("Seeded staff user {Email}", staff.Email);
        }

        db.SaveChanges();
    }
}

app.Run();
