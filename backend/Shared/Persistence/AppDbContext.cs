using Microsoft.EntityFrameworkCore;

namespace backend.Shared.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts)
    {
        
    }
}