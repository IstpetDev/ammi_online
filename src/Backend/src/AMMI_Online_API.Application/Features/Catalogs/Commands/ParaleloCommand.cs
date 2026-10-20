using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateParaleloCommand(string NombreParalelo,  int IdTipoJornada, int CupoMaximo
    ) : IRequest<Response<int>>;
public record UpdateParaleloCommand(int IdParalelo, string NombreParalelo, int IdTipoJornada, int CupoMaximo
    ) : IRequest<Response<bool>>;
public record DeleteParaleloCommand(int IdParalelo) : IRequest<Response<bool>>;