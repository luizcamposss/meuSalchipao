using AutoMapper;
using backend.Modules.Catalog.Contracts;
using backend.Shared.Persistence;
using Microsoft.EntityFrameworkCore;

namespace backend.Modules.Catalog.Services;

public class CatalogService : ICatalogService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public CatalogService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<ProductResponse>> GetAvailableAsync(CancellationToken ct)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Where(p => p.Available)
            .ToListAsync(ct);

        return _mapper.Map<List<ProductResponse>>(product);
    }

    public async Task<ProductResponse?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        return product is null ? null : _mapper.Map<ProductResponse>(product);
    }
}