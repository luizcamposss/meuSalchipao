using AutoMapper;
using backend.Modules.Catalog.Contracts;
using backend.Modules.Catalog.Domain;

namespace backend.Modules.Catalog.Mapping;

public class CatalogMappingProfile : Profile
{
    public CatalogMappingProfile()
    {
        CreateMap<Product, ProductResponse>();
    }
}