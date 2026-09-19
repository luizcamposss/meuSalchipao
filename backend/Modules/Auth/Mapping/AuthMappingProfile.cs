using AutoMapper;
using backend.Modules.Auth.Contracts;
using backend.Modules.Auth.Domain;

namespace backend.Modules.Auth.Mapping;

public class AuthMappingProfile : Profile
{
    public AuthMappingProfile()
    {
        CreateMap<User, RegisterResponse>();
        CreateMap<User, LoginResponse>();
    }
}
