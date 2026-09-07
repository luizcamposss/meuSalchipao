using backend.Modules.Payments.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Payments.Persistence;

public class PaymentWebhookEventConfiguration : IEntityTypeConfiguration<PaymentWebhookEvent>
{
    public void Configure(EntityTypeBuilder<PaymentWebhookEvent> builder)
    {
        builder.ToTable("payment_webhook_events");
        
        builder.HasKey(e => e.Id);

        builder.Property(e => e.EventId)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(e => e.PaymentId)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(e => e.Action)
            .IsRequired()
            .HasMaxLength(60);

        builder.HasIndex(e => e.EventId)
            .IsUnique();
    }
}