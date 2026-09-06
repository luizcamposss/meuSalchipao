using backend.Modules.Auth.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Auth.Persistence;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(191);

        builder.HasIndex(x => x.Email)
            .IsUnique();

        builder.Property(x => x.Enrollment)
            .IsRequired()
            .HasMaxLength(8);

        builder.HasIndex(x => x.Enrollment)
            .IsUnique();

        builder.Property(x => x.Shift)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(x => x.Role)
                .HasConversion<string>()
                .HasMaxLength(20);

        builder.Property(x => x.PasswordHash)
            .IsRequired()
            .HasMaxLength(255);
    }
}
