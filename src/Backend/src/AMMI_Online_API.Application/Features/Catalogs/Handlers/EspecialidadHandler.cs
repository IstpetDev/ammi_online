using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetEspecialidadHandler : IRequestHandler<GetEspecialidadQuery, Response<IEnumerable<EspecialidadDTO>>>
{
    private readonly IEspecialidad _repository;
    public GetEspecialidadHandler(IEspecialidad repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<EspecialidadDTO>>> Handle(GetEspecialidadQuery request, CancellationToken cancellationToken)
    {
        var especialidades = await _repository.FindAsync(
            request.IdEspecialidad,
            request.Detalle,
            cancellationToken);
        if (!especialidades.Any())
            return Response<IEnumerable<EspecialidadDTO>>.Failure("No se encontraron resultados");
        var result = especialidades.Select(e => new EspecialidadDTO
        {
            IdEspecialidad = e.IdEspecialidad,
            Detalle = e.Detalle,
        });
        return Response<IEnumerable<EspecialidadDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateEspecialidadHandler : IRequestHandler<CreateEspecialidadCommand, Response<int>>
{
    private readonly IEspecialidad _repository;
    public CreateEspecialidadHandler(IEspecialidad repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreateEspecialidadCommand request, CancellationToken cancellationToken)
    {
        var entity = new Especialidad
        {
            Detalle = request.Detalle,
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdEspecialidad, "Especialidad creada exitosamente");
    }
}

public class UpdateEspecialidadHandler : IRequestHandler<UpdateEspecialidadCommand, Response<bool>>
{
    private readonly IEspecialidad _repository;
    public UpdateEspecialidadHandler(IEspecialidad repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(UpdateEspecialidadCommand request, CancellationToken cancellationToken)
    {
        var existingEntity = await _repository.GetByIdAsync(request.IdEspecialidad, cancellationToken);
        if (existingEntity == null)
        {
            return Response<bool>.Failure("Especialidad no encontrada");
        }
        existingEntity.Detalle = request.Detalle;
        await _repository.UpdateAsync(existingEntity, cancellationToken);
        return Response<bool>.Success(true, "Especialidad actualizada exitosamente");
    }
}

public class DeleteEspecialidadHandler : IRequestHandler<DeleteEspecialidadCommand, Response<bool>>
{
    private readonly IEspecialidad _repository;
    public DeleteEspecialidadHandler(IEspecialidad repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeleteEspecialidadCommand request, CancellationToken cancellationToken)
    {
        var existingEntity = await _repository.GetByIdAsync(request.IdEspecialidad, cancellationToken);
        if (existingEntity == null)
        {
            return Response<bool>.Failure("Especialidad no encontrada");
        }
        await _repository.DeleteAsync(request.IdEspecialidad, cancellationToken);
        return Response<bool>.Success(true, "Especialidad eliminada exitosamente");
    }
}

