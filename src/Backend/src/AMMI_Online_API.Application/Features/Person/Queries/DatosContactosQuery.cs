using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Queries;

public record GetByDatosContactosAsync
    (
    int? IdDatosContacto,
    int? IdPersona,
    int? IdTipoDatoContacto,
    string? Detalle,
    bool? EsPrincipal
    ) : IRequest<Response<IEnumerable<DatosContactoDTO>>>;

public record GetAllDatosContactosQuery : IRequest<Response<IEnumerable<DatosContactoDTO>>>;
