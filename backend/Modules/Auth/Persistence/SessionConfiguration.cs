using backend.Modules.Auth.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Auth.Persistence;

public class SessionConfiguration : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.ToTable("sessions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.TokenHash)
            .IsRequired()
            .HasMaxLength(64)
            .IsFixedLength();

        builder.HasIndex(s => s.TokenHash)
            .IsUnique();

        builder.HasOne(s => s.User)
        .WithMany(u => u.Sessions)
        .HasForeignKey(s => s.UserId)
        .OnDelete(DeleteBehavior.Cascade);
    }
}
