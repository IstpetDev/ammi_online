using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using AMMI_Online_API.Application.Services;
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
    IRequestHandler<ActualizarFechasNotasMateriaCommand, DetalleMallaDTO>,
    IRequestHandler<DeleteDetalleMallaCommand, bool>,
    IRequestHandler<GetDetalleMallaPorModuloQuery, IEnumerable<DetalleMallaModuloDTO>>,
    IRequestHandler<GetFechasSugeridasModuloQuery, FechasSugeridasModuloDTO>
{
    private readonly IDetalleMallaRepository _repository;
    private readonly IInfraestructuraValidationService _validationService;

    public DetalleMallaHandler(IDetalleMallaRepository repository, IInfraestructuraValidationService validationService)
    {
        _repository = repository;
        _validationService = validationService;
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
        var (esValido, mensaje) = await _validationService
            .ValidarMallaSinMatriculadosAsync(request.CreateDto.IdMalla, cancellationToken);
        if (!esValido)
            throw new InvalidOperationException(mensaje);

        if (await _repository.ExistsMateriaInMallaAsync(request.CreateDto.IdMalla, request.CreateDto.IdMateria, cancellationToken))
        {
            throw new InvalidOperationException("La materia ya existe en esta malla.");
        }

        if (request.CreateDto.FechaInicio.HasValue && request.CreateDto.FechaFin.HasValue 
            && request.CreateDto.FechaFin < request.CreateDto.FechaInicio)
        {
            throw new InvalidOperationException("La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        if (request.CreateDto.DuracionHoras.HasValue && request.CreateDto.DuracionHoras <= 0)
        {
            throw new InvalidOperationException("La duración en horas debe ser mayor a 0.");
        }

        var entity = new DetalleMalla
        {
            IdMalla = request.CreateDto.IdMalla,
            IdMateria = request.CreateDto.IdMateria,
            IdPlantillaEvaluacion = request.CreateDto.IdPlantillaEvaluacion,
            IdAreaCompetencia = request.CreateDto.IdAreaCompetencia,
            Modulo = request.CreateDto.Modulo,
            FechaInicio = request.CreateDto.FechaInicio,
            FechaFin = request.CreateDto.FechaFin,
            DuracionHoras = request.CreateDto.DuracionHoras,
            DiasGracia = request.CreateDto.DiasGracia ?? 5
        };

        var created = await _repository.AddAsync(entity, cancellationToken);
        // Fetch again to get related data or simple map? Simple map won't have names.
        // For now, simple map or we need to fetch the related names.
        // Best approach: Load it back fully populated.
        return await Handle(new GetDetalleMallaByIdQuery(created.IdDetalleMalla), cancellationToken);
    }

    public async Task<IEnumerable<DetalleMallaDTO>> Handle(CreateBulkDetalleMallaCommand request, CancellationToken cancellationToken)
    {
        if (!request.CreateDtos.Any())
        {
            return new List<DetalleMallaDTO>();
        }

        var idMalla = request.CreateDtos.First().IdMalla;

        // Validar la malla (debe estar sin matriculados/postulados para poder modificarla)
        var (esValido, mensaje) = await _validationService
            .ValidarMallaSinMatriculadosAsync(idMalla, cancellationToken);
        if (!esValido)
            throw new InvalidOperationException(mensaje);

        // Obtener detalles de malla actuales
        var existingDetalles = await _repository.GetByMallaIdAsync(idMalla, cancellationToken);
        var existingDict = existingDetalles.ToDictionary(d => d.IdMateria);

        var incomingMaterias = request.CreateDtos.Select(d => d.IdMateria).ToHashSet();

        // 1. Eliminar materias que ya no están seleccionadas en el DTO entrante
        foreach (var existing in existingDetalles)
        {
            if (!incomingMaterias.Contains(existing.IdMateria))
            {
                await _repository.DeleteAsync(existing.IdDetalleMalla, cancellationToken);
            }
        }

        // 2. Actualizar las materias existentes o preparar nuevas
        var newEntities = new List<DetalleMalla>();
        foreach (var dto in request.CreateDtos)
        {
            if (existingDict.TryGetValue(dto.IdMateria, out var existing))
            {
                existing.IdPlantillaEvaluacion = dto.IdPlantillaEvaluacion;
                existing.IdAreaCompetencia = dto.IdAreaCompetencia;
                existing.Modulo = dto.Modulo;
                existing.FechaInicio = dto.FechaInicio;
                existing.FechaFin = dto.FechaFin;
                existing.DuracionHoras = dto.DuracionHoras;
                existing.DiasGracia = dto.DiasGracia ?? existing.DiasGracia ?? 5;

                await _repository.UpdateAsync(existing, cancellationToken);
            }
            else
            {
                newEntities.Add(new DetalleMalla
                {
                    IdMalla = dto.IdMalla,
                    IdMateria = dto.IdMateria,
                    IdPlantillaEvaluacion = dto.IdPlantillaEvaluacion,
                    IdAreaCompetencia = dto.IdAreaCompetencia,
                    Modulo = dto.Modulo,
                    FechaInicio = dto.FechaInicio,
                    FechaFin = dto.FechaFin,
                    DuracionHoras = dto.DuracionHoras,
                    DiasGracia = dto.DiasGracia ?? 5
                });
            }
        }

        // 3. Insertar nuevas materias
        if (newEntities.Any())
        {
            await _repository.AddRangeAsync(newEntities, cancellationToken);
        }

        // Retornar la lista actualizada de materias de esta malla
        var pagedResult = await Handle(new GetDetalleMallaByMallaIdQuery(idMalla, 1, 999), cancellationToken);
        return pagedResult.Items;
    }

    public async Task<DetalleMallaDTO> Handle(UpdateDetalleMallaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null) throw new KeyNotFoundException("DetalleMalla no encontrado");

        var (esValido, mensaje) = await _validationService
            .ValidarMallaSinMatriculadosAsync(entity.IdMalla, cancellationToken);
        if (!esValido)
            throw new InvalidOperationException(mensaje);

        if (request.UpdateDto.FechaInicio.HasValue && request.UpdateDto.FechaFin.HasValue 
            && request.UpdateDto.FechaFin < request.UpdateDto.FechaInicio)
        {
            throw new InvalidOperationException("La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        if (request.UpdateDto.DuracionHoras.HasValue && request.UpdateDto.DuracionHoras <= 0)
        {
            throw new InvalidOperationException("La duración en horas debe ser mayor a 0.");
        }

        // Validación: no cambiar modulo si tiene notas
        if (entity.Modulo != request.UpdateDto.Modulo && await _repository.TieneNotasAsync(request.Id, cancellationToken))
        {
            throw new InvalidOperationException("No se puede cambiar el módulo de una materia que ya tiene notas registradas.");
        }

        // Update fields
        entity.IdPlantillaEvaluacion = request.UpdateDto.IdPlantillaEvaluacion;
        entity.IdAreaCompetencia = request.UpdateDto.IdAreaCompetencia;
        entity.Modulo = request.UpdateDto.Modulo;
        entity.FechaInicio = request.UpdateDto.FechaInicio;
        entity.FechaFin = request.UpdateDto.FechaFin;
        entity.DuracionHoras = request.UpdateDto.DuracionHoras;
        entity.DiasGracia = request.UpdateDto.DiasGracia ?? entity.DiasGracia ?? 5;

        await _repository.UpdateAsync(entity, cancellationToken);
        
        // Return updated (GetById to refresh includes)
        return await Handle(new GetDetalleMallaByIdQuery(request.Id), cancellationToken);
    }

    public async Task<DetalleMallaDTO> Handle(ActualizarFechasNotasMateriaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Dto.IdDetalleMalla, cancellationToken);
        if (entity == null) throw new KeyNotFoundException("Detalle de materia no encontrado.");

        var ciclo = entity.IdMallaNavigation?.IdCicloNavigation;

        // Validar coherencia básica
        if (request.Dto.FechaInicio.HasValue && request.Dto.FechaFin.HasValue 
            && request.Dto.FechaFin < request.Dto.FechaInicio)
        {
            throw new InvalidOperationException("La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        if (request.Dto.DiasGracia.HasValue && request.Dto.DiasGracia < 0)
        {
            throw new InvalidOperationException("Los días de gracia no pueden ser negativos.");
        }

        // Validar contra límites del ciclo
        if (ciclo != null)
        {
            if (ciclo.FechaInicioEstimada.HasValue && request.Dto.FechaInicio.HasValue 
                && request.Dto.FechaInicio < ciclo.FechaInicioEstimada)
            {
                throw new InvalidOperationException($"La fecha de inicio ({request.Dto.FechaInicio.Value:dd/MM/yyyy}) no puede ser anterior al inicio del ciclo ({ciclo.FechaInicioEstimada.Value:dd/MM/yyyy}).");
            }

            if (ciclo.FechaFinEstimada.HasValue && request.Dto.FechaFin.HasValue 
                && request.Dto.FechaFin > ciclo.FechaFinEstimada)
            {
                throw new InvalidOperationException($"La fecha de fin ({request.Dto.FechaFin.Value:dd/MM/yyyy}) no puede ser posterior al fin del ciclo ({ciclo.FechaFinEstimada.Value:dd/MM/yyyy}).");
            }
        }

        entity.FechaInicio = request.Dto.FechaInicio;
        entity.FechaFin = request.Dto.FechaFin;
        entity.DiasGracia = request.Dto.DiasGracia ?? entity.DiasGracia ?? 5;

        await _repository.UpdateAsync(entity, cancellationToken);

        return await Handle(new GetDetalleMallaByIdQuery(entity.IdDetalleMalla), cancellationToken);
    }

    public async Task<bool> Handle(DeleteDetalleMallaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null) throw new KeyNotFoundException("DetalleMalla no encontrado");

        var (esValido, mensaje) = await _validationService
            .ValidarMallaSinMatriculadosAsync(entity.IdMalla, cancellationToken);
        if (!esValido)
            throw new InvalidOperationException(mensaje);

        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }

    public async Task<IEnumerable<DetalleMallaModuloDTO>> Handle(GetDetalleMallaPorModuloQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByMallaIdAsync(request.IdMalla, cancellationToken);
        
        var grouped = entities.GroupBy(e => e.Modulo)
            .Select(g => new DetalleMallaModuloDTO
            {
                Modulo = g.Key,
                FechaInicioModulo = g.Any(x => x.FechaInicio.HasValue) ? g.Min(x => x.FechaInicio) : null,
                FechaFinModulo = g.Any(x => x.FechaFin.HasValue) ? g.Max(x => x.FechaFin) : null,
                Materias = g.Select(MapToDTO).ToList()
            })
            .OrderBy(m => m.Modulo ?? 999) // nulls at the end
            .ToList();

        return grouped;
    }

    public async Task<FechasSugeridasModuloDTO> Handle(GetFechasSugeridasModuloQuery request, CancellationToken cancellationToken)
    {
        var (fechaInicio, fechaFin) = await _repository.GetFechasSugeridasModuloAsync(
            request.IdCiclo,
            request.Modulo,
            cancellationToken);

        return new FechasSugeridasModuloDTO
        {
            TieneFechasSugeridas = fechaInicio.HasValue || fechaFin.HasValue,
            Modulo = request.Modulo,
            FechaInicio = fechaInicio,
            FechaFin = fechaFin
        };
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
            Modulo = entity.Modulo,
            FechaInicio = entity.FechaInicio,
            FechaFin = entity.FechaFin,
            DuracionHoras = entity.DuracionHoras,
            DiasGracia = entity.DiasGracia,
            NombreMateria = entity.IdMateriaNavigation?.Detalle ?? string.Empty,
            HorasMateria = entity.IdMateriaNavigation?.HorasRequeridas ?? 0,
            NombrePlantilla = entity.IdPlantillaEvaluacionNavigation?.Nombre ?? string.Empty,
            NombreAreaCompetencia = entity.IdAreaCompetenciaNavigation?.Detalle ?? string.Empty,
            Paralelo = entity.IdMallaNavigation?.MallaParalelo?
                .Where(mp => mp.EsActivo)
                .Select(mp => {
                    var dist = entity.Distributivo?.FirstOrDefault(d => d.IdMallaParalelo == mp.IdMallaParalelo);
                    var docenteName = "Sin docente asignado";
                    if (dist?.IdPersonaNavigation?.IdPersonaNavigation != null)
                    {
                        var p = dist.IdPersonaNavigation.IdPersonaNavigation;
                        docenteName = $"{p.PrimerNombre} {p.PrimerApellido}".Trim();
                    }
                    return new MallaParaleloDTO
                    {
                        IdMallaParalelo = mp.IdMallaParalelo,
                        IdMalla = mp.IdMalla,
                        IdParalelo = mp.IdParalelo,
                        NombreParalelo = mp.IdParaleloNavigation?.Detalle ?? string.Empty,
                        CupoMaximo = mp.CupoMaximo,
                        EsActivo = mp.EsActivo,
                        AlumnosMatriculados = mp.Matricula?.Count ?? 0,
                        NombreDocente = docenteName
                    };
                }).ToList() ?? new List<MallaParaleloDTO>()
        };
    }
}
