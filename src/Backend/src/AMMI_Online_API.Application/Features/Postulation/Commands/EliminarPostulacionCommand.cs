using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Commands;

public record EliminarPostulacionCommand(int IdPostulacion) : IRequest<Response<bool>>;
