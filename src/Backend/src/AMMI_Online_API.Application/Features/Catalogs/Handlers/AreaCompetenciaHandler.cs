using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAreaCompetenciaHandler : IRequestHandler<GetAreaCompetenciaQuery, Response<IEnumerable<AreaCompetenciaDTO>>>
{
    private readonly IAreaCompetencia _repository;
    public GetAreaCompetenciaHandler(IAreaCompetencia repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<AreaCompetenciaDTO>>> Handle(GetAreaCompetenciaQuery request, CancellationToken cancellationToken)
    {
        var areas = await _repository.FindAsync(
            request.IdAreaCompetencia,
            request.IdArea,
            request.Detalle,
            cancellationToken);
        if (!areas.Any())
            return Response<IEnumerable<AreaCompetenciaDTO>>.Failure("No se encontraron resultados");
        var result = areas.Select(c => new AreaCompetenciaDTO
        {
            IdAreaCompetencia = c.IdAreaCompetencia,
            IdArea = c.IdArea,
            Detalle = c.Detalle
        });
        return Response<IEnumerable<AreaCompetenciaDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateAreaCompetenciaHandler : IRequestHandler<CreateAreaCompetenciaCommand, Response<int>>
{
    private readonly IAreaCompetencia _repository;
    public CreateAreaCompetenciaHandler(IAreaCompetencia repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreateAreaCompetenciaCommand request, CancellationToken cancellationToken)
    {
        var entity = new AreaCompetencia
        {
            IdArea = request.IdArea,
            Detalle = request.Detalle
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdAreaCompetencia, "AreaCompetencia creada exitosamente");
    }
}

public class UpdateAreaCompetenciaHandler : IRequestHandler<UpdateAreaCompetenciaCommand, Response<bool>>
{
    private readonly IAreaCompetencia _repository;
    public UpdateAreaCompetenciaHandler(IAreaCompetencia repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(UpdateAreaCompetenciaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdAreaCompetencia, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("AreaCompetencia no encontrada");
        entity.IdArea = request.IdArea;
        entity.Detalle = request.Detalle;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "AreaCompetencia actualizada exitosamente");
    }
}

public class DeleteAreaCompetenciaHandler : IRequestHandler<DeleteAreaCompetenciaCommand, Response<bool>>
{
    private readonly IAreaCompetencia _repository;
    public DeleteAreaCompetenciaHandler(IAreaCompetencia repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeleteAreaCompetenciaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdAreaCompetencia, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("AreaCompetencia no encontrada");
        await _repository.DeleteAsync(entity.IdAreaCompetencia, cancellationToken);
        return Response<bool>.Success(true, "AreaCompetencia eliminada exitosamente");
    }
}
