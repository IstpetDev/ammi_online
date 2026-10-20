using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Notas;
using MediatR;

namespace AMMI_Online_API.Application.Features.Notas.Queries;

public record GetNotasByParaleloAndEstructuraQuery(int IdParalelo, int IdPlantillaEstructura) : IRequest<Response<IEnumerable<NotaAlumnoParaleloDTO>>>;

public record GetResumenNotasParaleloQuery(int IdParalelo, int IdDetalleMalla) : IRequest<Response<ResumenNotasParaleloDTO>>;
