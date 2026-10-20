using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetCursoHandler : IRequestHandler<GetCursosQuery, Response<IEnumerable<CursosDTO>>>
{
    private readonly ICurso _repository;
    public GetCursoHandler(ICurso repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<CursosDTO>>> Handle(GetCursosQuery query, CancellationToken cancellationToken)
    {
        var cursos = await _repository.FindAsync(
            query.IdCursos,
            query.IdEspecialidad,
            query.Detalle,
            cancellationToken);
        if (!cursos.Any())
            return Response<IEnumerable<CursosDTO>>.Failure("No se encontraron resultados");
        var result = cursos.Select(c => new CursosDTO
        {
            IdCursos = c.IdCursos,
            IdEspecialidad = c.IdEspecialidad,
            Detalle = c.Detalle,
        });
        return Response<IEnumerable<CursosDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateCursoHandler : IRequestHandler<CreateCursoCommand, Response<int>>
{
    private readonly ICurso _repository;
    public CreateCursoHandler(ICurso repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreateCursoCommand request, CancellationToken cancellationToken)
    {
        var entity = new Cursos
        {
            IdEspecialidad = request.IdEspecialidad,
            Detalle = request.Detalle,
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdCursos, "Curso creado exitosamente");
    }
}

public class UpdateCursoHandler : IRequestHandler<UpdateCursoCommand, Response<bool>>
{
    private readonly ICurso _repository;
    public UpdateCursoHandler(ICurso repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateCursoCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdCurso, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Curso no encontrado");
        entity.IdEspecialidad = request.IdEspecialidad;
        entity.Detalle = request.Detalle;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Curso actualizado exitosamente");
    }
}

public class DeleteCursoHandler : IRequestHandler<DeleteCursoCommand, Response<bool>>
{
    private readonly ICurso _repository;
    public DeleteCursoHandler(ICurso repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeleteCursoCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdCurso, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Curso no encontrado");
        await _repository.DeleteAsync(entity.IdCursos, cancellationToken);
        return Response<bool>.Success(true, "Curso eliminado exitosamente");
    }
}