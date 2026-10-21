using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Queries;

public record GetMatriculasByMallaParaleloQuery(int IdMallaParalelo) : IRequest<Response<IEnumerable<MatriculaDTO>>>;
public record GetMatriculasByAlumnoQuery(int IdUsuario) : IRequest<Response<IEnumerable<MatriculaDTO>>>;
public record GetHistorialAcademicoQuery(int IdUsuario) : IRequest<Response<HistorialAcademicoDTO>>;
