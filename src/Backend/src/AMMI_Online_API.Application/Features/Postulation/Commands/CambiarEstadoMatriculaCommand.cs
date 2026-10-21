using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Commands;

public record CambiarEstadoMatriculaCommand(int IdMatricula, int IdEstadoMatricula) : IRequest<Response<bool>>;
