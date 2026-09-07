using AutoMapper;
using backend.Modules.Auth.Contracts;
using backend.Modules.Auth.Domain;

namespace backend.Modules.Auth.Mapping;

public class AuthMappingProfile : Profile
{
    public AuthMappingProfile()
    {
        // Entity -> outbound DTO only. The inbound direction (request -> User) is done
        // by hand in the service, because it isn't a plain copy: Password is hashed,
        // and Id/Role/Active/timestamps are set by the server.
        CreateMap<User, RegisterResponse>();
        CreateMap<User, LoginResponse>();
    }
}
