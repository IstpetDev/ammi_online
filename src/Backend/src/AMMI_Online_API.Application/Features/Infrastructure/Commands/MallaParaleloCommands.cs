using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Commands;

public record ActivarMallaParaleloCommand(ActivarMallaParaleloDTO Data) : IRequest<Response<bool>>;

public record DesactivarMallaParaleloCommand(int IdMallaParalelo) : IRequest<Response<bool>>;

public record CrearMallaParaleloCommand(CrearMallaParaleloDTO Data) : IRequest<Response<int>>;
