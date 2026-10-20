using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Distributive;
using AMMI_Online_API.Application.Features.Distributivo.Queries;
using AMMI_Online_API.Application.Features.Distributivo.Commands;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Distributive;
using MediatR;

namespace AMMI_Online_API.Application.Features.Distributivo.Handlers;

public class DistributivoHandler :
    IRequestHandler<GetDistributivoByIdQuery, Response<DistributivoDTO>>,
    IRequestHandler<GetAllDistributivosQuery, Response<IEnumerable<DistributivoDTO>>>,
    IRequestHandler<GetDistributivoByParaleloQuery, Response<IEnumerable<DistributivoDTO>>>,
    IRequestHandler<GetAsignacionesDocenteQuery, Response<IEnumerable<AsignacionDocenteDTO>>>,
    IRequestHandler<CreateDistributivoCommand, Response<int>>,
    IRequestHandler<UpdateDistributivoCommand, Response<bool>>,
    IRequestHandler<DeleteDistributivoCommand, Response<bool>>,
    IRequestHandler<CreateDistributivoMasivoCommand, Response<bool>>,
    IRequestHandler<GetDistributivoByMallaQuery, Response<PaginatedResult<DistributivoDTO>>>,
    IRequestHandler<GetDistributivoByCicloQuery, Response<PaginatedResult<DistributivoDTO>>>,
    IRequestHandler<GetCargaDocenteQuery, Response<CargaDocenteDTO>>,
    IRequestHandler<GetDocentesDisponiblesQuery, Response<IEnumerable<DocenteDisponibleDTO>>>
{
    private readonly IDistributivoRepository _repository;

    public DistributivoHandler(IDistributivoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(CreateDistributivoMasivoCommand request, CancellationToken ct)
    {
        var entities = new List<Domain.Entities.Distributivo>();
        foreach (var idParalelo in request.Data.IdsParalelos)
        {
            // Validate duplicates
            if (await _repository.ExisteAsignacionAsync(request.Data.IdDetalleMalla, idParalelo, null, ct))
                continue; // Skip if exists? Or error? Plan says "validate". For mass, skipping duplicates is safer or throwing error. 
                          // Let's assume skipping or we can return failure if ANY fails. 
                          // Better strategy: try to add all, if one exists, maybe fail the whole batch? 
                          // Re-reading Plan: "Admin marks paralelos... System creates multiple records". 
                          // Usually mass assignment implies "Assign where not assigned".
            
            entities.Add(new Domain.Entities.Distributivo
            {
                IdDetalleMalla = request.Data.IdDetalleMalla,
                IdPersona = request.Data.IdPersona,
                IdParalelo = idParalelo
            });
        }

        if (!entities.Any())
            return Response<bool>.Failure("No se crearon asignaciones. Verifique si ya existen.");

        await _repository.AddRangeAsync(entities, ct);
        return Response<bool>.Success(true, $"{entities.Count} asignaciones creadas exitosamente");
    }

    public async Task<Response<PaginatedResult<DistributivoDTO>>> Handle(GetDistributivoByMallaQuery request, CancellationToken ct)
    {
        var totalCount = await _repository.CountByMallaAsync(request.IdMalla, ct);
        var entities = await _repository.GetByMallaPagedAsync(request.IdMalla, request.PageNumber, request.PageSize, ct);
        var dtos = entities.Select(MapToDTO).ToList();
        var result = new PaginatedResult<DistributivoDTO>(dtos, totalCount, request.PageNumber, request.PageSize);
        return Response<PaginatedResult<DistributivoDTO>>.Success(result, "Distributivos encontrados");
    }

    public async Task<Response<PaginatedResult<DistributivoDTO>>> Handle(GetDistributivoByCicloQuery request, CancellationToken ct)
    {
        var totalCount = await _repository.CountByCicloAsync(request.IdCiclo, ct);
        var entities = await _repository.GetByCicloPagedAsync(request.IdCiclo, request.PageNumber, request.PageSize, ct);
        var result = new PaginatedResult<DistributivoDTO>(entities.Select(MapToDTO), totalCount, request.PageNumber, request.PageSize);
        return Response<PaginatedResult<DistributivoDTO>>.Success(result, "Distributivos encontrados");
    }

    public async Task<Response<CargaDocenteDTO>> Handle(GetCargaDocenteQuery request, CancellationToken ct)
    {
        var asignaciones = await _repository.GetByDocenteWithDetailsAsync(request.IdPersona, ct);
    
        asignaciones = asignaciones.Where(a => a.IdDetalleMallaNavigation?.IdMallaNavigation?.IdCicloNavigation?.EsActivo == true  ).ToList();
        if (!asignaciones.Any())
            return Response<CargaDocenteDTO>.Success(new CargaDocenteDTO { IdPersona = request.IdPersona }, "Sin asignaciones");

        var first = asignaciones.First().IdPersonaNavigation;
        var persona = first?.IdPersonaNavigation;

        // Calcular total de alumnos únicos sumando las matrículas de cada paralelo distinto
        var totalAlumnos = asignaciones
            .GroupBy(a => a.IdParalelo)
            .Sum(g => g.First().IdParaleloNavigation?.Matricula?.Count ?? 0);

        var carga = new CargaDocenteDTO
        {
            IdPersona = request.IdPersona,
            NombreDocente = persona != null ? $"{persona.PrimerNombre} {persona.PrimerApellido}" : string.Empty,
            DocumentoDocente = persona?.Documento ?? string.Empty,
            TotalMaterias = asignaciones.Select(a => a.IdDetalleMalla).Distinct().Count(),
            TotalParalelos = asignaciones.Select(a => a.IdParalelo).Distinct().Count(),
            TotalAlumnos = totalAlumnos,
            TotalHoras = asignaciones.Sum(a => a.IdDetalleMallaNavigation.IdMateriaNavigation.HorasRequeridas),
            Mallas = asignaciones.GroupBy(a => a.IdDetalleMallaNavigation.IdMalla)
                .Select(gMalla => new MallaCargaDTO
                {
                    IdMalla = gMalla.Key,
                    NombreMalla = gMalla.First().IdDetalleMallaNavigation.IdMallaNavigation.Detalle,
                    Materias = gMalla.GroupBy(a => a.IdDetalleMalla)
                        .Select(gMateria => new MateriaCargaDTO
                        {
                            IdDetalleMalla = gMateria.Key,
                            NombreMateria = gMateria.First().IdDetalleMallaNavigation.IdMateriaNavigation.Detalle,
                            Horas = gMateria.First().IdDetalleMallaNavigation.IdMateriaNavigation.HorasRequeridas,
                            Paralelos = gMateria.Select(a => new ParaleloCargaDTO
                            {
                                IdDistributivo = a.IdDistributivo,
                                IdParalelo = a.IdParalelo,
                                NombreParalelo = a.IdParaleloNavigation.NombreParalelo,
                                CantidadAlumnos = a.IdParaleloNavigation?.Matricula?.Count ?? 0
                            }).ToList()
                        }).ToList()
                }).ToList()
        };

        return Response<CargaDocenteDTO>.Success(carga, "Carga docente generada");
    }

    // ... Queries (omitted for brevity in replace, but kept in file) ...

    public async Task<Response<int>> Handle(CreateDistributivoCommand request, CancellationToken ct)
    {
        if (await _repository.ExisteAsignacionAsync(request.Data.IdDetalleMalla, request.Data.IdParalelo, null, ct))
        {
             return Response<int>.Failure("Ya existe una asignación para esta materia y paralelo.");
        }

        var entity = new Domain.Entities.Distributivo
        {
            IdDetalleMalla = request.Data.IdDetalleMalla,
            IdPersona = request.Data.IdPersona,
            IdParalelo = request.Data.IdParalelo
        };

        await _repository.AddAsync(entity, ct);
        return Response<int>.Success(entity.IdDistributivo, "Distributivo creado exitosamente");
    }

    public async Task<Response<bool>> Handle(UpdateDistributivoCommand request, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(request.Data.IdDistributivo, ct);
        if (entity == null) return Response<bool>.Failure("Distributivo no encontrado");

        entity.IdDetalleMalla = request.Data.IdDetalleMalla;
        entity.IdPersona = request.Data.IdPersona;
        entity.IdParalelo = request.Data.IdParalelo;

        await _repository.UpdateAsync(entity, ct);
        return Response<bool>.Success(true, "Distributivo actualizado exitosamente");
    }

    public async Task<Response<bool>> Handle(DeleteDistributivoCommand request, CancellationToken ct)
    {
        var exists = await _repository.ExistsAsync(request.Id, ct);
        if (!exists) return Response<bool>.Failure("Distributivo no encontrado");

        await _repository.DeleteAsync(request.Id, ct);
        return Response<bool>.Success(true, "Distributivo eliminado exitosamente");
    }

    public async Task<Response<DistributivoDTO>> Handle(GetDistributivoByIdQuery request, CancellationToken ct)
    {

        var entity = await _repository.GetByIdAsync(request.Id, ct);
        if (entity == null) return Response<DistributivoDTO>.Failure("Distributivo no encontrado");
        return Response<DistributivoDTO>.Success(MapToDTO(entity), "Distributivo encontrado");
    }

    public async Task<Response<IEnumerable<DistributivoDTO>>> Handle(GetAllDistributivosQuery request, CancellationToken ct)
    {
        var list = await _repository.GetAllAsync(ct);
        return Response<IEnumerable<DistributivoDTO>>.Success(list.Select(MapToDTO), "Distributivos encontrados");
    }

    public async Task<Response<IEnumerable<DistributivoDTO>>> Handle(GetDistributivoByParaleloQuery request, CancellationToken ct)
    {
        var list = await _repository.GetByParaleloAsync(request.IdParalelo, ct);
        return Response<IEnumerable<DistributivoDTO>>.Success(list.Select(MapToDTO), "Distributivos del paralelo encontrados");
    }

    public async Task<Response<IEnumerable<AsignacionDocenteDTO>>> Handle(GetAsignacionesDocenteQuery request, CancellationToken ct)
    {
        var list = await _repository.GetByDocenteAsync(request.IdPersona, ct);
        return Response<IEnumerable<AsignacionDocenteDTO>>.Success(list.Select(MapToAsignacionDTO), "Asignaciones encontradas");
    }

    public async Task<Response<IEnumerable<DocenteDisponibleDTO>>> Handle(GetDocentesDisponiblesQuery request, CancellationToken ct)
    {
        var docentes = await _repository.GetDocentesDisponiblesAsync(ct);
        var dtos = docentes.Select(d => new DocenteDisponibleDTO
        {
            IdPersona = d.IdPersona,
            NombreCompleto = d.NombreCompleto,
            Documento = d.Documento,
            AsignacionesActuales = d.AsignacionesActuales
        });
        return Response<IEnumerable<DocenteDisponibleDTO>>.Success(dtos, "Docentes disponibles encontrados");
    }

    private static DistributivoDTO MapToDTO(Domain.Entities.Distributivo entity)
    {
        if (entity == null) return new DistributivoDTO();

        var detalleMalla = entity.IdDetalleMallaNavigation;
        var materia = detalleMalla?.IdMateriaNavigation;
        var malla = detalleMalla?.IdMallaNavigation;
        var ciclo = malla?.IdCicloNavigation;
        var tipoOferta = malla?.IdTipoOfertaNavigation;
        var paralelo = entity.IdParaleloNavigation;
        var usuario = entity.IdPersonaNavigation;
        var persona = usuario?.IdPersonaNavigation;

        return new DistributivoDTO
        {
            IdDistributivo = entity.IdDistributivo,
            IdDetalleMalla = entity.IdDetalleMalla,
            IdPersona = entity.IdPersona,
            IdParalelo = entity.IdParalelo,

            // Datos del DetalleMalla
            IdMalla = detalleMalla?.IdMalla ?? 0,
            IdMateria = detalleMalla?.IdMateria ?? 0,

            // Datos de la Materia
            NombreMateria = materia?.Detalle ?? string.Empty,
            HorasMateria = materia?.HorasRequeridas ?? 0,

            // Datos de la Malla
            NombreMalla = malla?.Detalle ?? string.Empty,
            TipoOferta = tipoOferta?.Detalle ?? string.Empty,

            // Datos del Ciclo
            IdCiclo = malla?.IdCiclo ?? 0,
            NombreCiclo = ciclo?.Detalle ?? string.Empty,

            // Datos del Paralelo
            NombreParalelo = paralelo?.NombreParalelo ?? string.Empty,
            CupoMaximo = paralelo?.CupoMaximo ?? 0, 

            // Datos del Docente
            NombreDocente = persona != null
                ? $"{persona.PrimerNombre} {persona.PrimerApellido}".Trim()
                : string.Empty,
            DocumentoDocente = persona?.Documento ?? string.Empty,

            // Conteo de alumnos desde la navegación Matricula del Paralelo
            CantidadAlumnos = paralelo?.Matricula?.Count ?? 0
        };
    }

    // Mapeo para DetalleMalla sin ningún Distributivo asignado (docente = null)
    private static DistributivoDTO MapDetalleMallaSinDocenteToDTO(DetalleMalla detalleMalla)
    {
        var materia = detalleMalla.IdMateriaNavigation;
        var malla = detalleMalla.IdMallaNavigation;
        var ciclo = malla?.IdCicloNavigation;
        var tipoOferta = malla?.IdTipoOfertaNavigation;

        return new DistributivoDTO
        {
            IdDistributivo = null,
            IdDetalleMalla = detalleMalla.IdDetalleMalla,
            IdPersona = null,
            IdParalelo = null,
            IdMalla = detalleMalla.IdMalla,
            IdMateria = detalleMalla.IdMateria,
            NombreMateria = materia?.Detalle ?? string.Empty,
            HorasMateria = materia?.HorasRequeridas ?? 0,
            NombreMalla = malla?.Detalle ?? string.Empty,
            TipoOferta = tipoOferta?.Detalle ?? string.Empty,
            IdCiclo = malla?.IdCiclo ?? 0,
            NombreCiclo = ciclo?.Detalle ?? string.Empty,
            NombreParalelo = null,
            CupoMaximo = null,
            NombreDocente = null,
            DocumentoDocente = null,
            CantidadAlumnos = 0
        };
    }

    private static AsignacionDocenteDTO MapToAsignacionDTO(Domain.Entities.Distributivo entity) => new()
    {
        IdDistributivo = entity.IdDistributivo,
        IdDetalleMalla = entity.IdDetalleMalla,
        IdParalelo = entity.IdParalelo,
        NombreMateria = entity.IdDetalleMallaNavigation?.IdMateriaNavigation?.Detalle ?? string.Empty,
        NombreParalelo = entity.IdParaleloNavigation?.NombreParalelo ?? string.Empty,
        IdPlantillaEvaluacion = entity.IdDetalleMallaNavigation?.IdPlantillaEvaluacion ?? 0,
        NombrePlantilla = entity.IdDetalleMallaNavigation?.IdPlantillaEvaluacionNavigation?.Nombre ?? string.Empty,
        CantidadAlumnos = entity.IdParaleloNavigation?.Matricula?.Count ?? 0
    };
}
