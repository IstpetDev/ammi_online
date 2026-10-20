using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class EspecieHandler :
    IRequestHandler<GetAllEspeciesQuery, IEnumerable<EspecieDTO>>,
    IRequestHandler<CreateEspecieCommand, EspecieDTO>,
    IRequestHandler<UpdateEspecieCommand, EspecieDTO>,
    IRequestHandler<DeleteEspecieCommand, bool>
{
    private readonly IEspecieRepository _repository;

    public EspecieHandler(IEspecieRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<EspecieDTO>> Handle(GetAllEspeciesQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);
        return entities.Select(e => new EspecieDTO
        {
            IdEspecie = e.IdEspecie,
            Detalle = e.Detalle,
            EsDiferible = e.EsDiferible,
            MaximoDiferidos = e.MaximoDiferidos,
            Activo = e.Activo
        });
    }

    public async Task<EspecieDTO> Handle(CreateEspecieCommand request, CancellationToken cancellationToken)
    {
        var entity = new Especie
        {
            Detalle = request.Especie.Detalle,
            EsDiferible = request.Especie.EsDiferible,
            MaximoDiferidos = request.Especie.MaximoDiferidos,
            Activo = request.Especie.Activo
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return new EspecieDTO
        {
            IdEspecie = created.IdEspecie,
            Detalle = created.Detalle,
            EsDiferible = created.EsDiferible,
            MaximoDiferidos = created.MaximoDiferidos,
            Activo = created.Activo
        };
    }

    public async Task<EspecieDTO> Handle(UpdateEspecieCommand request, CancellationToken cancellationToken)
    {
        var entity = new Especie
        {
            IdEspecie = request.Especie.IdEspecie,
            Detalle = request.Especie.Detalle,
            EsDiferible = request.Especie.EsDiferible,
            MaximoDiferidos = request.Especie.MaximoDiferidos,
            Activo = request.Especie.Activo
        };

        var updated = await _repository.UpdateAsync(entity, cancellationToken);

        return new EspecieDTO
        {
            IdEspecie = updated.IdEspecie,
            Detalle = updated.Detalle,
            EsDiferible = updated.EsDiferible,
            MaximoDiferidos = updated.MaximoDiferidos,
            Activo = updated.Activo
        };
    }

    public async Task<bool> Handle(DeleteEspecieCommand request, CancellationToken cancellationToken)
    {
        var existing = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (existing == null)
            return false;
        else
            existing.Activo = false;
        await _repository.UpdateAsync(existing, cancellationToken);
        return true;
    }
}
