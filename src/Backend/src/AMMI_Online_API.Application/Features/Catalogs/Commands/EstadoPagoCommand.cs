using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateEstadoPagoCommand(CreateEstadoPagoDTO EstadoPago) : IRequest<Response<int>>;
public record UpdateEstadoPagoCommand(UpdateEstadoPagoDTO EstadoPago) : IRequest<Response<bool>>;
public record DeleteEstadoPagoCommand(int IdEstadoPago) : IRequest<Response<bool>>;
