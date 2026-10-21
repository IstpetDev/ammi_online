using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Adjuntos.Commands;

public record DeleteAdjuntoCommand(int Id) : IRequest<Response<bool>>;
