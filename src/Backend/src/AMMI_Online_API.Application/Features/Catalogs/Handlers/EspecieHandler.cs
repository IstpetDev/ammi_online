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
            EsMatricula = e.EsMatricula,
            EsPension = e.EsPension,
            Activo = e.Activo
        });
    }

    public async Task<EspecieDTO> Handle(CreateEspecieCommand request, CancellationToken cancellationToken)
    {
        var entity = new Especie
        {
            Detalle = request.Especie.Detalle,
            EsMatricula = request.Especie.EsMatricula,
            EsPension = request.Especie.EsPension,
            Activo = request.Especie.Activo ?? true
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return new EspecieDTO
        {
            IdEspecie = created.IdEspecie,
            Detalle = created.Detalle,
            EsMatricula = created.EsMatricula,
            EsPension = created.EsPension,
            Activo = created.Activo
        };
    }

    public async Task<EspecieDTO> Handle(UpdateEspecieCommand request, CancellationToken cancellationToken)
    {
        var entity = new Especie
        {
            IdEspecie = request.Especie.IdEspecie,
            Detalle = request.Especie.Detalle,
            EsMatricula = request.Especie.EsMatricula,
            EsPension = request.Especie.EsPension,
            Activo = request.Especie.Activo ?? true
        };

        var updated = await _repository.UpdateAsync(entity, cancellationToken);

        return new EspecieDTO
        {
            IdEspecie = updated.IdEspecie,
            Detalle = updated.Detalle,
            EsMatricula = updated.EsMatricula,
            EsPension = updated.EsPension,
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
