using backend.Modules.Sac.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Modules.Sac.Persistence;

public class SacMessageConfiguration : IEntityTypeConfiguration<SacMessage>
{
    public void Configure(EntityTypeBuilder<SacMessage> builder)
    {
        builder.ToTable("sac_messages");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Message)
            .IsRequired();
    }
}
