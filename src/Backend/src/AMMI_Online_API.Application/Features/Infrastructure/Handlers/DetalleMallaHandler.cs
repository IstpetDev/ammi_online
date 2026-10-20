using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Handlers;

public class DetalleMallaHandler :
    IRequestHandler<GetDetalleMallaByIdQuery, DetalleMallaDTO>,
    IRequestHandler<GetDetalleMallaByMallaIdQuery, PaginatedResult<DetalleMallaDTO>>,
    IRequestHandler<CreateDetalleMallaCommand, DetalleMallaDTO>,
    IRequestHandler<CreateBulkDetalleMallaCommand, IEnumerable<DetalleMallaDTO>>,
    IRequestHandler<UpdateDetalleMallaCommand, DetalleMallaDTO>,
    IRequestHandler<DeleteDetalleMallaCommand, bool>
{
    private readonly IDetalleMallaRepository _repository;

    public DetalleMallaHandler(IDetalleMallaRepository repository)
    {
        _repository = repository;
    }

    public async Task<DetalleMallaDTO> Handle(GetDetalleMallaByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null) return null;

        return MapToDTO(entity);
    }

    public async Task<PaginatedResult<DetalleMallaDTO>> Handle(GetDetalleMallaByMallaIdQuery request, CancellationToken cancellationToken)
    {
        var totalCount = await _repository.CountByMallaIdAsync(request.IdMalla, cancellationToken);
        var entities = await _repository.GetByMallaIdPagedAsync(request.IdMalla, request.PageNumber, request.PageSize, cancellationToken);
        return new PaginatedResult<DetalleMallaDTO>(entities.Select(MapToDTO), totalCount, request.PageNumber, request.PageSize);
    }

    public async Task<DetalleMallaDTO> Handle(CreateDetalleMallaCommand request, CancellationToken cancellationToken)
    {
        // Validation: Uniqueness is checked at Repo level or Service, here we blindly add or check first?
        // Plan says "ValidarMateriaUnicaEnMalla" in "Fase 6: Validaciones", postponing complex checks?
        // Basic uniqueness check:
        if (await _repository.ExistsMateriaInMallaAsync(request.CreateDto.IdMalla, request.CreateDto.IdMateria, cancellationToken))
        {
            throw new InvalidOperationException("La materia ya existe en esta malla.");
        }

        var entity = new DetalleMalla
        {
            IdMalla = request.CreateDto.IdMalla,
            IdMateria = request.CreateDto.IdMateria,
            IdPlantillaEvaluacion = request.CreateDto.IdPlantillaEvaluacion,
            IdAreaCompetencia = request.CreateDto.IdAreaCompetencia
        };

        var created = await _repository.AddAsync(entity, cancellationToken);
        // Fetch again to get related data or simple map? Simple map won't have names.
        // For now, simple map or we need to fetch the related names.
        // Best approach: Load it back fully populated.
        return await Handle(new GetDetalleMallaByIdQuery(created.IdDetalleMalla), cancellationToken);
    }

    public async Task<IEnumerable<DetalleMallaDTO>> Handle(CreateBulkDetalleMallaCommand request, CancellationToken cancellationToken)
    {
        var entities = new List<DetalleMalla>();
        foreach (var dto in request.CreateDtos)
        {
            if (await _repository.ExistsMateriaInMallaAsync(dto.IdMalla, dto.IdMateria, cancellationToken))
            {
                continue; // Skip duplicates or throw? Converting to soft skip for bulk.
            }

            entities.Add(new DetalleMalla
            {
                IdMalla = dto.IdMalla,
                IdMateria = dto.IdMateria,
                IdPlantillaEvaluacion = dto.IdPlantillaEvaluacion,
                IdAreaCompetencia = dto.IdAreaCompetencia
            });
        }

        if (entities.Any())
        {
            await _repository.AddRangeAsync(entities, cancellationToken);
        }

        // Return basic DTOs as refetching all might be heavy? Or refetch by MallaId?
        // For simplicity returning manually constructed DTOs (wo names) or Refetch by the MallaId of the first one?
        // Usually bulk add is for a specific Malla.
        if (entities.Any())
        {
            var pagedResult = await Handle(new GetDetalleMallaByMallaIdQuery(entities.First().IdMalla), cancellationToken);
            return pagedResult.Items;
        }
        return new List<DetalleMallaDTO>();
    }

    public async Task<DetalleMallaDTO> Handle(UpdateDetalleMallaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null) throw new KeyNotFoundException("DetalleMalla no encontrado");

        // Update fields
        entity.IdPlantillaEvaluacion = request.UpdateDto.IdPlantillaEvaluacion;
        entity.IdAreaCompetencia = request.UpdateDto.IdAreaCompetencia;
        // Malla and Materia usually not changed in Update, requires Delete+Create if changing key core parts.

        await _repository.UpdateAsync(entity, cancellationToken);
        
        // Return updated (GetById to refresh includes)
        return await Handle(new GetDetalleMallaByIdQuery(request.Id), cancellationToken);
    }

    public async Task<bool> Handle(DeleteDetalleMallaCommand request, CancellationToken cancellationToken)
    {
        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }

    private static DetalleMallaDTO MapToDTO(DetalleMalla entity)
    {
        return new DetalleMallaDTO
        {
            IdDetalleMalla = entity.IdDetalleMalla,
            IdMalla = entity.IdMalla,
            IdMateria = entity.IdMateria,
            IdPlantillaEvaluacion = entity.IdPlantillaEvaluacion,
            IdAreaCompetencia = entity.IdAreaCompetencia,
            NombreMateria = entity.IdMateriaNavigation?.Detalle ?? string.Empty,
            HorasMateria = entity.IdMateriaNavigation?.HorasRequeridas ?? 0,
            NombrePlantilla = entity.IdPlantillaEvaluacionNavigation?.Nombre ?? string.Empty,
            NombreAreaCompetencia = entity.IdAreaCompetenciaNavigation?.Detalle ?? string.Empty,
            Paralelo = entity.Distributivo?
                .Where(d => d.IdParaleloNavigation != null)
                .GroupBy(d => d.IdParalelo)
                .Select(g => g.First())
                .Select(d => new ParaleloDTO
                {
                    IdParalelo = d.IdParalelo,
                    NombreParalelo = d.IdParaleloNavigation.NombreParalelo ?? string.Empty,
                    CupoMaximo = d.IdParaleloNavigation.CupoMaximo
                }).ToList() ?? new List<ParaleloDTO>()
        };
    }
}
