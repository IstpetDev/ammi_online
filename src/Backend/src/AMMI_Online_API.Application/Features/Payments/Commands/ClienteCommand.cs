using AMMI_Online_API.API.Controllers.Payments;
using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Commands;

public record CreateClienteCommand(CreateClienteDTO cliente) : IRequest<Response<int>>;
public record UpdateClienteCommand(UpdateClienteDTO cliente) : IRequest<Response<bool>>;
public record DeleteClienteCommand(int IdCliente) : IRequest<Response<bool>>;