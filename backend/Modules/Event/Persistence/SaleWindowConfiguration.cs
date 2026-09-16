using backend.Modules.Event.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Event.Persistence;

public class SaleWindowConfiguration : IEntityTypeConfiguration<SaleWindow>
{
    public void Configure(EntityTypeBuilder<SaleWindow> builder)
    {
        builder.ToTable("sale_windows");

        builder.HasKey(w => w.Id);

        builder.Property(w => w.Label)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasOne<EventSettings>()
            .WithMany(e => e.SaleWindows)
            .HasForeignKey(w => w.EventSettingsId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
