using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Commands;

public record GenerarMatriculaCommand(GenerarMatriculaDTO Data) : IRequest<Response<GenerarMatriculaResultDTO>>;
public record UpdateMatriculaCommand(int IdMatricula, int IdUsuarioAlumno, int IdMallaParalelo, int IdEstadoMatricula) : IRequest<Response<bool>>;
public record RegistrarExamenRemedialCommand(int IdDetalleMatricula, decimal NotaRemedial) : IRequest<Response<bool>>;
public record CambiarParaleloMatriculaCommand(int IdMatricula, int IdMallaParaleloNuevo) : IRequest<Response<CambiarParaleloResultDTO>>;

