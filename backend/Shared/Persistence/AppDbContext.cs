using backend.Modules.Auth.Domain;
using backend.Modules.Catalog.Domain;
using backend.Modules.Event.Domain;
using backend.Modules.Orders.Domain;
using backend.Modules.Payments.Domain;
using backend.Modules.Sac.Domain;
using Microsoft.EntityFrameworkCore;

namespace backend.Shared.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts)
    {

    }
    public DbSet<User> Users { get; set; }
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Product> Products { get; set; }
    public DbSet<EventSettings> Events { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<PaymentWebhookEvent> PaymentWebhookEvents { get; set; }
    public DbSet<SacTicket> SacTickets => Set<SacTicket>();
    public DbSet<SacMessage> SacMessages => Set<SacMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly
        );
    }
}