using backend.Modules.Auth.Domain;
using backend.Modules.Catalog.Domain;
using backend.Modules.Event.Domain;
using Microsoft.EntityFrameworkCore;

namespace backend.Shared.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts)
    {

    }

    public DbSet<User> Users { get; set;}
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Product> Products { get; set;}
    public DbSet<EventSettings> Events { get; set;}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly
        );
    }
}