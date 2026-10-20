using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class PlantillaEvaluacionHandler :
    IRequestHandler<GetAllPlantillasEvaluacionQuery, IEnumerable<PlantillaEvaluacionDTO>>,
    IRequestHandler<GetPlantillasEvaluacionActivasQuery, IEnumerable<PlantillaEvaluacionDTO>>,
    IRequestHandler<CreatePlantillaEvaluacionCommand, PlantillaEvaluacionDTO>,
    IRequestHandler<UpdatePlantillaEvaluacionCommand, PlantillaEvaluacionDTO>,
    IRequestHandler<DeletePlantillaEvaluacionCommand, bool>
{
    private readonly IPlantillaEvaluacionRepository _repository;

    public PlantillaEvaluacionHandler(IPlantillaEvaluacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<PlantillaEvaluacionDTO>> Handle(GetAllPlantillasEvaluacionQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);
        return entities.Select(e => new PlantillaEvaluacionDTO
        {
            IdPlantillaEvaluacion = e.IdPlantillaEvaluacion,
            Nombre = e.Nombre,
            Detalle = e.Detalle,
            EsActivo = e.EsActivo
        });
    }

    public async Task<IEnumerable<PlantillaEvaluacionDTO>> Handle(GetPlantillasEvaluacionActivasQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetActivosAsync(cancellationToken);
        return entities.Select(e => new PlantillaEvaluacionDTO
        {
            IdPlantillaEvaluacion = e.IdPlantillaEvaluacion,
            Nombre = e.Nombre,
            Detalle = e.Detalle,
            EsActivo = e.EsActivo
        });
    }

    public async Task<PlantillaEvaluacionDTO> Handle(CreatePlantillaEvaluacionCommand request, CancellationToken cancellationToken)
    {
        var entity = new PlantillaEvaluacion
        {
            Nombre = request.PlantillaEvaluacion.Nombre,
            Detalle = request.PlantillaEvaluacion.Detalle,
            EsActivo = request.PlantillaEvaluacion.EsActivo
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return new PlantillaEvaluacionDTO
        {
            IdPlantillaEvaluacion = created.IdPlantillaEvaluacion,
            Nombre = created.Nombre,
            Detalle = created.Detalle,
            EsActivo = created.EsActivo
        };
    }

    public async Task<PlantillaEvaluacionDTO> Handle(UpdatePlantillaEvaluacionCommand request, CancellationToken cancellationToken)
    {
        var entity = new PlantillaEvaluacion
        {
            IdPlantillaEvaluacion = request.PlantillaEvaluacion.IdPlantillaEvaluacion,
            Nombre = request.PlantillaEvaluacion.Nombre,
            Detalle = request.PlantillaEvaluacion.Detalle,
            EsActivo = request.PlantillaEvaluacion.EsActivo
        };

        var updated = await _repository.UpdateAsync(entity, cancellationToken);

        return new PlantillaEvaluacionDTO
        {
            IdPlantillaEvaluacion = updated.IdPlantillaEvaluacion,
            Nombre = updated.Nombre,
            Detalle = updated.Detalle,
            EsActivo = updated.EsActivo
        };
    }

    public async Task<bool> Handle(DeletePlantillaEvaluacionCommand request, CancellationToken cancellationToken)
    {
        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }
}
