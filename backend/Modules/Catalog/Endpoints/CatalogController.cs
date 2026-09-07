using backend.Modules.Catalog.Contracts;
using backend.Modules.Catalog.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Catalog.Endpoints;

[ApiController]
[Route("products")]
public class CatalogController : ControllerBase
{
    private readonly ICatalogService _catalogService;

    public CatalogController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductResponse>>> GetAll(CancellationToken ct)
    {
        return Ok(await _catalogService.GetAvailableAsync(ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductResponse>> GetById(
            Guid id,
            CancellationToken ct)
    {
        var product = await _catalogService.GetByIdAsync(id, ct);
        return product is null ? NotFound() : Ok(product);
    }
}
