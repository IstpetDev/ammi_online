using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Commands;

public record CreateModuloOperacionCommand(ModuloOperacionCreateDTO ModuloOperacion) : IRequest<Response<int>>;
public record UpdateModuloOperacionCommand(ModuloOperacionUpdateDTO ModuloOperacion) : IRequest<Response<bool>>;
public record DeleteModuloOperacionCommand(int IdModuloOperacion) : IRequest<Response<bool>>;
