using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateParaleloCommand(string Detalle, int? Orden
    ) : IRequest<Response<int>>;
public record UpdateParaleloCommand(int IdParalelo, string Detalle, int? Orden
    ) : IRequest<Response<bool>>;
public record DeleteParaleloCommand(int IdParalelo) : IRequest<Response<bool>>;
