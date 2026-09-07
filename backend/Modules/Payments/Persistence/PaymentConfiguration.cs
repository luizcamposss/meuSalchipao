using backend.Modules.Payments.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Payments.Persistence;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("payments");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Provider)
            .IsRequired()
            .HasMaxLength(40);

        builder.Property(p => p.ExternalId)
            .HasMaxLength(64);

        builder.Property(p => p.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(p => p.StatusDetail)
            .HasMaxLength(120);

        builder.Property(p => p.Amount)
        .HasPrecision(10, 2);

        builder.Property(p => p.PixCode)
            .HasMaxLength(512);

        builder.HasIndex(p => p.OrderId);

        builder.HasIndex(p => p.ExternalId)
            .IsUnique();
    }
}