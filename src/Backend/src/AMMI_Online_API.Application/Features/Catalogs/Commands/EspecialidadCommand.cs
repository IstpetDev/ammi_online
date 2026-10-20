using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateEspecialidadCommand(string Detalle) : IRequest<Response<int>>;
public record UpdateEspecialidadCommand( int IdEspecialidad, string Detalle) : IRequest<Response<bool>>;
public record DeleteEspecialidadCommand(int IdEspecialidad) : IRequest<Response<bool>>;

