using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateInstitucionCommand (string Detalle, string RepresentanteLegal, string Ruc, int? IdAdjunto
    ) : IRequest<Response<int>>;
public record UpdateInstitucionCommand (int IdInstitucion, string Detalle, string RepresentanteLegal, string Ruc, int? IdAdjunto
    ) : IRequest<Response<bool>>;
public record DeleteInstitucionCommand(int IdInstitucion) : IRequest<Response<bool>>;
