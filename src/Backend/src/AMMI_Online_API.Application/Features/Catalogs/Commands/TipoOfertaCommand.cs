using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoOfertaCommand(string Detalle, int Duracion, bool EsActivo) : IRequest<Response<int>>;
public record UpdateTipoOfertaCommand(int IdtipoOferta, string Detalle, int Duracion, bool EsActivo) : IRequest<Response<bool>>;
public record DeleteTipoOfertaCommand(int IdtipoOferta) : IRequest<Response<bool>>;
