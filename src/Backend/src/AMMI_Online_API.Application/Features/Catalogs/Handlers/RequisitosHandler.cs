using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class RequisitosHandler :
    IRequestHandler<GetAllRequisitosQuery, IEnumerable<RequisitosDTO>>,
    IRequestHandler<GetRequisitosByMallaQuery, IEnumerable<RequisitosDTO>>,
    IRequestHandler<CreateRequisitosCommand, RequisitosDTO>,
    IRequestHandler<UpdateRequisitosCommand, RequisitosDTO>,
    IRequestHandler<DeleteRequisitosCommand, bool>
{
    private readonly IRequisitosRepository _repository;

    public RequisitosHandler(IRequisitosRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<RequisitosDTO>> Handle(GetAllRequisitosQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);
        return entities.Select(e => new RequisitosDTO
        {
            IdRequisitos = e.IdRequisitos,
            IdMalla = 0, // Link is now via MallaRequisitos
            Detalle = e.Detalle,
            EsObligatorio = e.EsObligatorio,
            BloqueaInscripcion = e.BloqueaInscripcion,
            TipoDato = e.TipoDato,
            EsMayorEdad = e.EsMayorEdad,
            EsFoto = e.EsFoto
        });
    }

    public async Task<IEnumerable<RequisitosDTO>> Handle(GetRequisitosByMallaQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByMallaAsync(request.IdMalla, cancellationToken);
        return entities.Select(e => new RequisitosDTO
        {
            IdRequisitos = e.IdRequisitos,
            IdMalla = request.IdMalla, // Malla ID is known from request
            Detalle = e.Detalle,
            EsObligatorio = e.EsObligatorio,
            BloqueaInscripcion = e.BloqueaInscripcion,
            TipoDato = e.TipoDato,
            EsMayorEdad = e.EsMayorEdad,
            EsFoto = e.EsFoto
        });
    }


    public async Task<RequisitosDTO> Handle(CreateRequisitosCommand request, CancellationToken cancellationToken)
    {
        var entity = new Requisitos
        {
            Detalle = request.Requisitos.Detalle,
            EsObligatorio = request.Requisitos.EsObligatorio,
            BloqueaInscripcion = request.Requisitos.BloqueaInscripcion,
            TipoDato = request.Requisitos.TipoDato,
            EsMayorEdad = request.Requisitos.EsMayorEdad,
            EsFoto = request.Requisitos.EsFoto
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return new RequisitosDTO
        {
            IdRequisitos = created.IdRequisitos,
            IdMalla = 0, // IdMalla is no longer on the entity
            Detalle = created.Detalle,
            EsObligatorio = created.EsObligatorio,
            BloqueaInscripcion = created.BloqueaInscripcion,
            TipoDato = created.TipoDato,
            EsMayorEdad = created.EsMayorEdad,
            EsFoto = created.EsFoto
        };
    }

    public async Task<RequisitosDTO> Handle(UpdateRequisitosCommand request, CancellationToken cancellationToken)
    {
        var entity = new Requisitos
        {
            IdRequisitos = request.Requisitos.IdRequisitos,
            Detalle = request.Requisitos.Detalle,
            EsObligatorio = request.Requisitos.EsObligatorio,
            BloqueaInscripcion = request.Requisitos.BloqueaInscripcion,
            TipoDato = request.Requisitos.TipoDato,
            EsMayorEdad = request.Requisitos.EsMayorEdad,
            EsFoto = request.Requisitos.EsFoto
        };

        var updated = await _repository.UpdateAsync(entity, cancellationToken);

        return new RequisitosDTO
        {
            IdRequisitos = updated.IdRequisitos,
            IdMalla = 0, // IdMalla is no longer on the entity
            Detalle = updated.Detalle,
            EsObligatorio = updated.EsObligatorio,
            BloqueaInscripcion = updated.BloqueaInscripcion,
            TipoDato = updated.TipoDato,
            EsMayorEdad = updated.EsMayorEdad,
            EsFoto = updated.EsFoto
        };
    }

    public async Task<bool> Handle(DeleteRequisitosCommand request, CancellationToken cancellationToken)
    {
        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }
}
