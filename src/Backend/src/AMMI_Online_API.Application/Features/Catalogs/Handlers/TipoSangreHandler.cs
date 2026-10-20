using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class TipoSangreHandler :
    IRequestHandler<GetAllTipoSangreQuery, IEnumerable<TipoSangreDTO>>,
    IRequestHandler<GetTipoSangreByIdQuery, TipoSangreDTO>,
    IRequestHandler<CreateTipoSangreCommand, TipoSangreDTO>,
    IRequestHandler<UpdateTipoSangreCommand, TipoSangreDTO>,
    IRequestHandler<DeleteTipoSangreCommand, bool>
{
    private readonly ITipoSangreRepository _repository;

    public TipoSangreHandler(ITipoSangreRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<TipoSangreDTO>> Handle(GetAllTipoSangreQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);
        return entities.Select(e => new TipoSangreDTO
        {
            IdTipoSangre = e.IdTipoSangre,
            Detalle = e.Detalle
        });
    }

    public async Task<TipoSangreDTO> Handle(GetTipoSangreByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null) return null;

        return new TipoSangreDTO
        {
            IdTipoSangre = entity.IdTipoSangre,
            Detalle = entity.Detalle
        };
    }

    public async Task<TipoSangreDTO> Handle(CreateTipoSangreCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoSangre
        {
            Detalle = request.TipoSangre.Detalle
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return new TipoSangreDTO
        {
            IdTipoSangre = created.IdTipoSangre,
            Detalle = created.Detalle
        };
    }

    public async Task<TipoSangreDTO> Handle(UpdateTipoSangreCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoSangre
        {
            IdTipoSangre = request.TipoSangre.IdTipoSangre,
            Detalle = request.TipoSangre.Detalle
        };

        var updated = await _repository.UpdateAsync(entity, cancellationToken);

        return new TipoSangreDTO
        {
            IdTipoSangre = updated.IdTipoSangre,
            Detalle = updated.Detalle
        };
    }

    public async Task<bool> Handle(DeleteTipoSangreCommand request, CancellationToken cancellationToken)
    {
        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }
}
