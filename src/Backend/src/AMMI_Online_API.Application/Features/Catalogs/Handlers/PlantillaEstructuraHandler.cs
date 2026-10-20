using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class PlantillaEstructuraHandler :
    IRequestHandler<GetPlantillaEstructuraArbolQuery, List<PlantillaEstructuraDTO>>,
    IRequestHandler<GetPlantillaEstructuraNodosQuery, IEnumerable<PlantillaEstructuraDTO>>,
    IRequestHandler<GetPlantillaEstructuraByIdQuery, PlantillaEstructuraDTO>,
    IRequestHandler<GetValidacionPesosQuery, ValidacionPesosDTO>,
    IRequestHandler<CreatePlantillaEstructuraCommand, PlantillaEstructuraDTO>,
    IRequestHandler<CreateEstructuraCompletaCommand, bool>,
    IRequestHandler<UpdatePlantillaEstructuraCommand, PlantillaEstructuraDTO>,
    IRequestHandler<DeletePlantillaEstructuraCommand, bool>,
    IRequestHandler<ReordenarNodosCommand, bool>,
    IRequestHandler<DuplicarPlantillaCommand, PlantillaEvaluacion>
{
    private readonly IPlantillaEstructuraRepository _repository;
    private readonly IPlantillaEstructuraService _service;

    public PlantillaEstructuraHandler(IPlantillaEstructuraRepository repository, IPlantillaEstructuraService service)
    {
        _repository = repository;
        _service = service;
    }

    public async Task<List<PlantillaEstructuraDTO>> Handle(GetPlantillaEstructuraArbolQuery request, CancellationToken cancellationToken)
    {
        return await _service.GetEstructuraArbolAsync(request.IdPlantilla, cancellationToken);
    }

    public async Task<IEnumerable<PlantillaEstructuraDTO>> Handle(GetPlantillaEstructuraNodosQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByPlantillaIdAsync(request.IdPlantilla, cancellationToken);
        return entities.Select(MapToDTO);
    }

    public async Task<PlantillaEstructuraDTO> Handle(GetPlantillaEstructuraByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null) return null;
        return MapToDTO(entity);
    }

    public async Task<ValidacionPesosDTO> Handle(GetValidacionPesosQuery request, CancellationToken cancellationToken)
    {
        return await _service.ValidarPesosAsync(request.IdPlantilla, cancellationToken);
    }

    public async Task<PlantillaEstructuraDTO> Handle(CreatePlantillaEstructuraCommand request, CancellationToken cancellationToken)
    {
        var entity = new PlantillaEstructura
        {
            IdPlantillaEvaluacion = request.CreateDto.IdPlantillaEvaluacion,
            IdNodoPadre = request.CreateDto.IdNodoPadre,
            NodoNombre = request.CreateDto.NodoNombre,
            Peso = request.CreateDto.Peso,
            IdTipoPlantillaEstrucutra = request.CreateDto.IdTipoPlantillaEstructura,
            Orden = request.CreateDto.Orden
        };

        var created = await _repository.AddAsync(entity, cancellationToken);
        // Map manually as Include is not guaranteed on Add Return unless refetched.
        // Simple map or refetch. 
        return MapToDTO(created); // Warning: Navigations might be null
    }

    public async Task<bool> Handle(CreateEstructuraCompletaCommand request, CancellationToken cancellationToken)
    {
        return await _service.CrearEstructuraCompletaAsync(request.Dto, cancellationToken);
    }

    public async Task<PlantillaEstructuraDTO> Handle(UpdatePlantillaEstructuraCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null) throw new KeyNotFoundException("Nodo no encontrado");

        entity.NodoNombre = request.UpdateDto.NodoNombre;
        entity.Peso = request.UpdateDto.Peso;
        entity.IdTipoPlantillaEstrucutra = request.UpdateDto.IdTipoPlantillaEstructura;
        entity.Orden = request.UpdateDto.Orden;

        await _repository.UpdateAsync(entity, cancellationToken);
        return await Handle(new GetPlantillaEstructuraByIdQuery(request.Id), cancellationToken);
    }

    public async Task<bool> Handle(DeletePlantillaEstructuraCommand request, CancellationToken cancellationToken)
    {
        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }

    public async Task<bool> Handle(ReordenarNodosCommand request, CancellationToken cancellationToken)
    {
        return await _service.ReordenarNodosAsync(request.IdsOrdenados, cancellationToken);
    }

    public async Task<PlantillaEvaluacion> Handle(DuplicarPlantillaCommand request, CancellationToken cancellationToken)
    {
        return await _service.DuplicarPlantillaAsync(request.IdOriginal, request.NuevoNombre, cancellationToken);
    }

    private static PlantillaEstructuraDTO MapToDTO(PlantillaEstructura entity)
    {
        return new PlantillaEstructuraDTO
        {
            IdPlantillaEstructura = entity.IdPlantillaEstructura,
            IdPlantillaEvaluacion = entity.IdPlantillaEvaluacion,
            IdNodoPadre = entity.IdNodoPadre,
            IdNodoHermano = entity.IdNodoHermano,
            NodoNombre = entity.NodoNombre,
            Peso = entity.Peso,
            IdTipoPlantillaEstructura = entity.IdTipoPlantillaEstrucutra,
            Orden = entity.Orden,
            TipoNombre = entity.IdTipoPlantillaEstrucutraNavigation?.Detalle ?? ""
        };
    }
}
