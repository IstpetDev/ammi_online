using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class BeneficioHandler : 
    IRequestHandler<GetBeneficioByIdQuery, BeneficioDTO>,
    IRequestHandler<GetBeneficioByIdEspecie, IEnumerable<BeneficioDTO>>,
    IRequestHandler<GetAllBeneficiosQuery, IEnumerable<BeneficioDTO>>,
    IRequestHandler<CreateBeneficioCommand, BeneficioDTO>,
    IRequestHandler<UpdateBeneficioCommand, BeneficioDTO>,
    IRequestHandler<DeleteBeneficioCommand, bool>
{
    private readonly IBeneficioRepository _repository;

    public BeneficioHandler(IBeneficioRepository repository)
    {
        _repository = repository;
    }

    public async Task<BeneficioDTO> Handle(GetBeneficioByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null) return null;
        return new BeneficioDTO
        {
            IdBeneficio = entity.IdBeneficio,
            Detalle = entity.Detalle,
            AplicaA = entity.AplicaA,
            Activo = entity.Activo
        };
    }
    public async Task<IEnumerable<BeneficioDTO>> Handle(GetBeneficioByIdEspecie request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdEspecieAsync(request.IdEspecie, cancellationToken);
        if (entity == null) return Enumerable.Empty<BeneficioDTO>();
        return new List<BeneficioDTO>
        {
            new BeneficioDTO
            {
                IdBeneficio = entity.IdBeneficio,
                Detalle = entity.Detalle,
                TipoValor = entity.TipoValor,
                Valor = entity.Valor,
                EsBeca = entity.EsBeca,
                Activo = entity.Activo
            }
        };
    }

    public async Task<IEnumerable<BeneficioDTO>> Handle(GetAllBeneficiosQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);
        return entities.Select(e => new BeneficioDTO
        {
            IdBeneficio = e.IdBeneficio,
            Detalle = e.Detalle,
            TipoValor = e.TipoValor,
            Valor = e.Valor,
            AplicaA = e.AplicaA,
            EsBeca = e.EsBeca,
            Activo = e.Activo
        });
    }

    public async Task<BeneficioDTO> Handle(CreateBeneficioCommand request, CancellationToken cancellationToken)
    {
        var entity = new Beneficio
        {
            Detalle = request.Beneficio.Detalle,
            TipoValor = request.Beneficio.TipoValor,
            Valor = request.Beneficio.Valor,
            AplicaA = request.Beneficio.AplicaA,
            EsBeca = request.Beneficio.EsBeca,
            Activo = request.Beneficio.Activo
        };
        var created = await _repository.AddAsync(entity, cancellationToken);
        return new BeneficioDTO
        {
            IdBeneficio = created.IdBeneficio,
            Detalle = created.Detalle,
            TipoValor = created.TipoValor,
            Valor = created.Valor,
            AplicaA = created.AplicaA,
            EsBeca = created.EsBeca,
            Activo = created.Activo
        };
    }

    public async Task<BeneficioDTO> Handle(UpdateBeneficioCommand request, CancellationToken cancellationToken)
    {
        var entity = new Beneficio
        {
            IdBeneficio = request.Beneficio.IdBeneficio,
            Detalle = request.Beneficio.Detalle,
            TipoValor = request.Beneficio.TipoValor,
            Valor = request.Beneficio.Valor,
            AplicaA = request.Beneficio.AplicaA,
            EsBeca = request.Beneficio.EsBeca,
            Activo = request.Beneficio.Activo
        };
        var updated = await _repository.UpdateAsync(entity, cancellationToken);
        return new BeneficioDTO
        {
            IdBeneficio = updated.IdBeneficio,
            Detalle = updated.Detalle,
            TipoValor = updated.TipoValor,
            Valor = updated.Valor,
            AplicaA = updated.AplicaA,
            EsBeca = updated.EsBeca,
            Activo = updated.Activo
        };
    }
    public async Task<bool> Handle(DeleteBeneficioCommand request, CancellationToken cancellationToken)
    {
        var existing = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (existing == null) return false;
        else
            existing.Activo = false;
        await _repository.UpdateAsync(existing, cancellationToken);
        return true;
    }
}
