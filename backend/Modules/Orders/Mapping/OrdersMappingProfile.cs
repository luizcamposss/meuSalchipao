using AutoMapper;
using backend.Modules.Orders.Contracts;
using backend.Modules.Orders.Domain;

namespace backend.Modules.Orders.Mapping;

public class OrdersMappingProfile : Profile
{
    public OrdersMappingProfile()
    {
        // Order.Items -> OrderResponse.Items is mapped automatically once the element map exists.
        CreateMap<Order, OrderResponse>();
        CreateMap<OrderItem, OrderItemResponse>();
    }
}
