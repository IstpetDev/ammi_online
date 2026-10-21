using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Notas;
using MediatR;

namespace AMMI_Online_API.Application.Features.Notas.Queries;

public record GetNotasByMallaParaleloAndEstructuraQuery(int IdMallaParalelo, int IdPlantillaEstructura) : IRequest<Response<IEnumerable<NotaAlumnoParaleloDTO>>>;

public record GetNotasByParaleloQuery(int IdMallaParalelo, int? IdDetalleMatricula = null, int? IdDetalleMalla = null, int? IdMatricula = null) : IRequest<Response<IEnumerable<NotasAlumnoDTO>>>;

public record GetActasParaleloQuery(int IdMallaParalelo, int? IdDetalleMalla = null) : IRequest<Response<IEnumerable<ActaAlumnoDTO>>>;
