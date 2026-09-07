using AutoMapper;
using backend.Modules.Sac.Contracts;
using backend.Modules.Sac.Domain;

namespace backend.Modules.Sac.Mapping;

public class SacMappingProfile : Profile
{
    public SacMappingProfile()
    {
        CreateMap<SacTicket, SacTicketResponse>();
        CreateMap<SacMessage, SacMessageResponse>();
    }
}
