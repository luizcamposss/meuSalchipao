using backend.Modules.Catalog.Contracts;

namespace backend.Modules.Catalog.Services;

public interface ICatalogService
{
    Task<IReadOnlyList<ProductResponse>> GetAvailableAsync(CancellationToken ct);
    Task<ProductResponse?> GetByIdAsync(Guid id, CancellationToken ct);
}