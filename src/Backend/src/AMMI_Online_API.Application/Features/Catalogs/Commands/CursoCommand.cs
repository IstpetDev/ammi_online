using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateCursoCommand( int IdEspecialidad, string Detalle) : IRequest<Response<int>>;
public record UpdateCursoCommand( int IdCurso, int IdEspecialidad, string Detalle) : IRequest<Response<bool>>;
public record DeleteCursoCommand(int IdCurso) : IRequest<Response<bool>>;

