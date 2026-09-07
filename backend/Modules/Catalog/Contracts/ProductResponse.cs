namespace backend.Modules.Catalog.Contracts;

public class ProductResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set;} = null!;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool Available { get; set; }
}