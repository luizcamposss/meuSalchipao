using backend.Modules.Auth.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Auth.Persistence;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(191);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.Enrollment)
            .IsRequired()
            .HasMaxLength(8);

        builder.HasIndex(u => u.Enrollment)
            .IsUnique();

        builder.Property(u => u.Shift)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(u => u.Role)
                .HasConversion<string>()
                .HasMaxLength(20);

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(255);
    }
}
