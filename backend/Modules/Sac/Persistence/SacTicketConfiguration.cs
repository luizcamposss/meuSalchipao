using backend.Modules.Sac.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Sac.Persistence;

public class SacTicketConfiguration : IEntityTypeConfiguration<SacTicket>
{
    public void Configure(EntityTypeBuilder<SacTicket> builder)
    {
        builder.ToTable("sac_tickets");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Subject)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(t => t.Description)
            .IsRequired();

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(t => t.Priority)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(t => t.UserId);
        builder.HasIndex(t => t.Status);

        builder.HasMany(t => t.Messages)
            .WithOne(m => m.Ticket)
            .HasForeignKey(m => m.TicketId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
