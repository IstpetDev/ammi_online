using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoEstadoAprobacionCommand(string Detalle) : IRequest<Response<int>>;
public record UpdateTipoEstadoAprobacionCommand(int IdTipoEstadoAprobacion, string Detalle) : IRequest<Response<bool>>;
public record DeleteTipoEstadoAprobacionCommand(int IdTipoEstadoAprobacion) : IRequest<Response<bool>>;
