using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Handlers;

public class MallaHandler :
    IRequestHandler<GetAllMallasQuery, PaginatedResult<MallaDTO>>,
    IRequestHandler<GetMallaByIdQuery, MallaDTO?>,
    IRequestHandler<GetMallasByCicloIdQuery, IEnumerable<MallaDTO>>,
    IRequestHandler<CreateMallaCommand, MallaDTO>,
    IRequestHandler<UpdateMallaCommand, MallaDTO>,
    IRequestHandler<DeleteMallaCommand, bool>,
    IRequestHandler<GetMallaByTipoOfertaWithActiveCicloQuery, IEnumerable<MallaDTO>>
{
    private readonly IMallaRepository _repository;

    public MallaHandler(IMallaRepository repository)
    {
        _repository = repository;
    }

    private static MallaDTO MapToDTO(Malla e)
    {
        return new MallaDTO
        {
            IdMalla = e.IdMalla,
            Detalle = e.Detalle,
            IdCursos = e.IdCursos,
            IdTipoOferta = e.IdTipoOferta,
            IdCiclo = e.IdCiclo,
            NombreCurso = e.IdCursosNavigation?.Detalle ?? string.Empty,
            NombreTipoOferta = e.IdTipoOfertaNavigation?.Detalle ?? string.Empty,
            DetalleCiclo = e.IdCicloNavigation?.Detalle ?? string.Empty,
            OrdenCurso = e.IdCursosNavigation?.Orden,
            CicloEsActivo = e.IdCicloNavigation?.EsActivo ?? false,
            TieneDetalleMalla = e.DetalleMalla != null && e.DetalleMalla.Any()
        };
    }

public async Task<PaginatedResult<MallaDTO>> Handle(GetAllMallasQuery request, CancellationToken cancellationToken)
{
    var totalCount = await _repository.CountAllAsync(
        request.IdMalla, request.Detalle, request.IdCursos, request.IdTipoOferta, request.IdCiclo, cancellationToken);

    var entities = await _repository.GetAllPagedAsync(
        request.IdMalla, request.Detalle, request.IdCursos, request.IdTipoOferta, request.IdCiclo,
        request.PageNumber, request.PageSize, cancellationToken);

    return new PaginatedResult<MallaDTO>(entities.Select(MapToDTO), totalCount, request.PageNumber, request.PageSize);
}

    public async Task<MallaDTO?> Handle(GetMallaByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdWithRelationsAsync(request.IdMalla, cancellationToken);
        return entity != null ? MapToDTO(entity) : null;
    }

    public async Task<IEnumerable<MallaDTO>> Handle(GetMallasByCicloIdQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByCicloIdAsync(request.IdCiclo, cancellationToken);
        return entities.Select(MapToDTO);
    }

    public async Task<IEnumerable<MallaDTO>> Handle(GetMallaByTipoOfertaWithActiveCicloQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByTipoOfertaWithActiveCicloAsync(request.IdTipoOferta, cancellationToken);
        return entities.Select(MapToDTO);
    }

    public async Task<MallaDTO> Handle(CreateMallaCommand request, CancellationToken cancellationToken)
    {
        var entity = new Malla
        {
            Detalle = request.Malla.Detalle,
            IdCursos = request.Malla.IdCursos,
            IdTipoOferta = request.Malla.IdTipoOferta,
            IdCiclo = request.Malla.IdCiclo,
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return new MallaDTO
        {
            IdMalla = created.IdMalla,
            Detalle = created.Detalle,
            IdCursos = created.IdCursos,
            IdTipoOferta = created.IdTipoOferta,
            IdCiclo = created.IdCiclo
        };
    }

    public async Task<MallaDTO> Handle(UpdateMallaCommand request, CancellationToken cancellationToken)
    {
        var entity = new Malla
        {
            IdMalla = request.Malla.IdMalla,
            Detalle = request.Malla.Detalle,
            IdCursos = request.Malla.IdCursos,
            IdTipoOferta = request.Malla.IdTipoOferta,
            IdCiclo = request.Malla.IdCiclo,
        };

        var updated = await _repository.UpdateAsync(entity, cancellationToken);

        return new MallaDTO
        {
            IdMalla = updated.IdMalla,
            Detalle = updated.Detalle,
            IdCursos = updated.IdCursos,
            IdTipoOferta = updated.IdTipoOferta,
            IdCiclo = updated.IdCiclo
        };
    }

    public async Task<bool> Handle(DeleteMallaCommand request, CancellationToken cancellationToken)
    {
        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }
}
