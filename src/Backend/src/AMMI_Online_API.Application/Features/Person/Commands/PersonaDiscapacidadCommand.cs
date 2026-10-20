using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Application.Features.Person.Commands;

public record CreatePersonaDiscapacidadCommand(
    int IdPersona,
    int Porcentaje,
    string Recomendaciones,
    int IdTipoDiscapacidad,
    IFormFile Archivo
) : IRequest<Response<int>>;

public record UpdatePersonaDiscapacidadCommand(
    int IdPersonaDiscapacidad,
    int IdPersona,
    int Porcentaje,
    string Recomendaciones,
    int IdTipoDiscapacidad,
    IFormFile Archivo
) : IRequest<Response<bool>>;

public record DeletePersonaDiscapacidadCommand(int IdPersonaDiscapacidad) : IRequest<Response<bool>>;