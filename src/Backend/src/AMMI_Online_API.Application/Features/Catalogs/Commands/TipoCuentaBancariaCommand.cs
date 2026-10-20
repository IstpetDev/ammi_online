using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoCuentaBancariaCommand(CreateTipoCuentaDTO TipoCuenta) : IRequest<Response<int>>;

public record UpdateTipoCuentaBancariaCommand(UpdateTipoCuentaDTO TipoCuenta) : IRequest<Response<bool>>;

public record DeleteTipoCuentaBancariaCommand(int IdTipoCuenta) : IRequest<Response<bool>>;
