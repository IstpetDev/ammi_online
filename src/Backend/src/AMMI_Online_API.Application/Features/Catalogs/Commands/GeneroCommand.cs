using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Catalogs.DTOs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateGeneroCommand(string Nombre) : IRequest<Response<GeneroCreateDTO>>;
public record UpdateGeneroCommand(int IdGenero, string Nombre) : IRequest<Response<GeneroUpdateDTO>>;
public record DeleteGeneroCommand(int IdGenero) : IRequest<Response<bool>>;
