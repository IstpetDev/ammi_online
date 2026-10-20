using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class TipoReglaCalculoHandler :
    IRequestHandler<GetAllTipoReglaCalculosQuery, IEnumerable<TipoReglaCalculoDTO>>,
    IRequestHandler<CreateTipoReglaCalculoCommand, TipoReglaCalculoDTO>,
    IRequestHandler<UpdateTipoReglaCalculoCommand, TipoReglaCalculoDTO>,
    IRequestHandler<DeleteTipoReglaCalculoCommand, bool>
{
    private readonly ITipoReglaCalculoRepository _repository;

    public TipoReglaCalculoHandler(ITipoReglaCalculoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<TipoReglaCalculoDTO>> Handle(GetAllTipoReglaCalculosQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);
        return entities.Select(t => new TipoReglaCalculoDTO
        {
            IdTipoReglaCalculo = t.IdTipoReglaCalculo,
            Detalle = t.Detalle
        });
    }

    public async Task<TipoReglaCalculoDTO> Handle(CreateTipoReglaCalculoCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoReglaCalculo
        {
            Detalle = request.TipoReglaCalculo.Detalle
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return new TipoReglaCalculoDTO
        {
            IdTipoReglaCalculo = created.IdTipoReglaCalculo,
            Detalle = created.Detalle
        };
    }

    public async Task<TipoReglaCalculoDTO> Handle(UpdateTipoReglaCalculoCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoReglaCalculo
        {
            IdTipoReglaCalculo = request.TipoReglaCalculo.IdTipoReglaCalculo,
            Detalle = request.TipoReglaCalculo.Detalle
        };

        var updated = await _repository.UpdateAsync(entity, cancellationToken);

        return new TipoReglaCalculoDTO
        {
            IdTipoReglaCalculo = updated.IdTipoReglaCalculo,
            Detalle = updated.Detalle
        };
    }

    public async Task<bool> Handle(DeleteTipoReglaCalculoCommand request, CancellationToken cancellationToken)
    {
        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }
}
