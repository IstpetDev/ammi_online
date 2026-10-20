using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public record GetCuentaBancariaQuery(
    int? IdCuentaBancaria, 
    int? IdTipoCuenta, 
    string? NumeroCuenta, 
    string? Banco, 
    bool? Activo) : IRequest<Response<IEnumerable<CuentaBancariaDTO>>>;
