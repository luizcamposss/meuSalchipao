using backend.Modules.Event.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Event.Persistence;

public class EventSettingsConfiguration : IEntityTypeConfiguration<EventSettings>
{
    public void Configure(EntityTypeBuilder<EventSettings> builder)
    {
        builder.ToTable("event_settings");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.ForcedPhase)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasData(new EventSettings
        {
            Id = new Guid("11111111-0000-0000-0000-000000000001"),
            SalesOpenAt = new DateTime(2026, 9, 8, 0, 0, 0, DateTimeKind.Utc),
            SalesCloseAt = new DateTime(2026, 9, 14, 23, 59, 0, DateTimeKind.Utc),
            RedemptionOpensAt = new DateTime(2026, 9, 17, 0, 0, 0, DateTimeKind.Utc),
            ForcedPhase = ForcedPhase.Auto,
            MorningSaleOpensAt = new DateTime(2026, 9, 17, 9, 0, 0, DateTimeKind.Utc),
            MorningSaleClosesAt = new DateTime(2026, 9, 17, 15, 0, 0, DateTimeKind.Utc),
            MorningSaleCap = 50,
            MorningSaleCount = 0,
            AfternoonSaleOpensAt = new DateTime(2026, 9, 17, 16, 0, 0, DateTimeKind.Utc),
            AfternoonSaleClosesAt = new DateTime(2026, 9, 17, 20, 0, 0, DateTimeKind.Utc),
            AfternoonSaleCap = 50,
            AfternoonSaleCount = 0,
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedBy = null,
        });
    }
}