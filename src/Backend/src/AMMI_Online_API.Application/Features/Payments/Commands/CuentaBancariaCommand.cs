using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Commands;

public record CreateCuentaBancariaCommand(CreateCuentaBancariaDTO cuentaBancaria) : IRequest<Response<int>>;
public record UpdateCuentaBancariaCommand(UpdateCuentaBancariaDTO cuentaBancaria) : IRequest<Response<bool>>;

public record DesactivateCuentaBancariaCommand(int IdCuentaBancaria) : IRequest<Response<bool>>;
