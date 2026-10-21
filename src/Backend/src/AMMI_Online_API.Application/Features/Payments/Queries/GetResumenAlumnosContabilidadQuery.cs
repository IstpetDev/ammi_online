using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public record GetResumenAlumnosContabilidadQuery : IRequest<Response<IEnumerable<ResumenAlumnoContabilidadDTO>>>
{
    public int IdCiclo { get; init; }
    public int? IdCurso { get; init; }
    public string? Documento { get; init; }
}
