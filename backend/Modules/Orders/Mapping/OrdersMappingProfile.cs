using AutoMapper;
using backend.Modules.Orders.Contracts;
using backend.Modules.Orders.Domain;

namespace backend.Modules.Orders.Mapping;

public class OrdersMappingProfile : Profile
{
    public OrdersMappingProfile()
    {
        CreateMap<Order, OrderResponse>();
        CreateMap<OrderItem, OrderItemResponse>();
    }
}
