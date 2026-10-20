using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Queries;

public record GetByPersonaAsync 
    (
    int? IdPersona,
    int? IdTipoDocumento,
    string? Documento,
    int? IdGenero,
    string? PrimerNombre,
    string? SegundoNombre,
    string? PrimerApellido,
    string? SegundoApellido,
    bool? Activo
    ) : IRequest<Response<IEnumerable<PersonaDTO>>>;

