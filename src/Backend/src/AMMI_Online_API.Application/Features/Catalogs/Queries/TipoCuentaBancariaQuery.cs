using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetTipoCuentaBancariaQuery(int? IdTipoCuenta, string? Detalle) : IRequest<Response<IEnumerable<TipoCuentaDTO>>>;

