using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Queries;

public record GetByParentescoAsync
    (
    int IdParentesco,
    int IdPersonaOrigen,
    int IdPersonaDestino,
    int IdTipoParentesco,
    bool? Representante,
    bool? Tutor,
    bool? ResponsableFinciero,
    bool? ConviveAlumno
    ) : IRequest<Response<IEnumerable<ParentescoDTO>>>;

public record GetAllParentescoQuery : IRequest<Response<IEnumerable<ParentescoDTO>>>;
