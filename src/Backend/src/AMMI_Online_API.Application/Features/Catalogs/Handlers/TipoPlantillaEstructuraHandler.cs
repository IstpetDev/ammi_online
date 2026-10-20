using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class TipoPlantillaEstructuraHandler :
    IRequestHandler<GetAllTipoPlantillaEstructurasQuery, IEnumerable<TipoPlantillaEstructuraDTO>>,
    IRequestHandler<CreateTipoPlantillaEstructuraCommand, TipoPlantillaEstructuraDTO>,
    IRequestHandler<UpdateTipoPlantillaEstructuraCommand, TipoPlantillaEstructuraDTO>,
    IRequestHandler<DeleteTipoPlantillaEstructuraCommand, bool>
{
    private readonly ITipoPlantillaEstructuraRepository _repository;

    public TipoPlantillaEstructuraHandler(ITipoPlantillaEstructuraRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<TipoPlantillaEstructuraDTO>> Handle(GetAllTipoPlantillaEstructurasQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);
        return entities.Select(t => new TipoPlantillaEstructuraDTO
        {
            IdTipoPlantillaEstrucutra = t.IdTipoPlantillaEstrucutra,
            Detalle = t.Detalle
        });
    }

    public async Task<TipoPlantillaEstructuraDTO> Handle(CreateTipoPlantillaEstructuraCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoPlantillaEstrucutra
        {
            Detalle = request.TipoPlantillaEstructura.Detalle
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return new TipoPlantillaEstructuraDTO
        {
            IdTipoPlantillaEstrucutra = created.IdTipoPlantillaEstrucutra,
            Detalle = created.Detalle
        };
    }

    public async Task<TipoPlantillaEstructuraDTO> Handle(UpdateTipoPlantillaEstructuraCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoPlantillaEstrucutra
        {
            IdTipoPlantillaEstrucutra = request.TipoPlantillaEstructura.IdTipoPlantillaEstrucutra,
            Detalle = request.TipoPlantillaEstructura.Detalle
        };

        var updated = await _repository.UpdateAsync(entity, cancellationToken);

        return new TipoPlantillaEstructuraDTO
        {
            IdTipoPlantillaEstrucutra = updated.IdTipoPlantillaEstrucutra,
            Detalle = updated.Detalle
        };
    }

    public async Task<bool> Handle(DeleteTipoPlantillaEstructuraCommand request, CancellationToken cancellationToken)
    {
        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }
}
