using backend.Modules.Orders.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Orders.Persistence;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.ProductName)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(i => i.UnitPrice).HasPrecision(10, 2);

    }
}
