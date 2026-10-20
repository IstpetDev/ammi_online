using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Queries;

public record GetByPersonaDireccionAsync 
    (
    int? IdPersonaDireccion,
    int? IdPersona,
    int? IdParroquia,
    string? DireccionDomiciliaria,
    bool? Activo
    ) : IRequest<Response<IEnumerable<PersonaDireccionDTO>>>;

