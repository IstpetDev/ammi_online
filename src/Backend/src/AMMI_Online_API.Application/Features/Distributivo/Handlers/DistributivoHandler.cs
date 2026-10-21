using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Distributive;
using AMMI_Online_API.Application.Features.Distributivo.Queries;
using AMMI_Online_API.Application.Features.Distributivo.Commands;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Distributive;
using AMMI_Online_API.Application.Services;
using MediatR;

namespace AMMI_Online_API.Application.Features.Distributivo.Handlers;

public class DistributivoHandler :
    IRequestHandler<GetDistributivoByIdQuery, Response<DistributivoConAlumnosDTO>>,
    IRequestHandler<GetAllDistributivosQuery, Response<IEnumerable<DistributivoDTO>>>,
    IRequestHandler<GetDistributivoByMallaParaleloQuery, Response<IEnumerable<DistributivoDTO>>>,
    IRequestHandler<GetAsignacionesDocenteQuery, Response<IEnumerable<AsignacionDocenteDTO>>>,
    IRequestHandler<CreateDistributivoCommand, Response<int>>,
    IRequestHandler<UpdateDistributivoCommand, Response<bool>>,
    IRequestHandler<DeleteDistributivoCommand, Response<bool>>,
    IRequestHandler<CreateDistributivoMasivoCommand, Response<bool>>,
    IRequestHandler<GetDistributivoByMallaQuery, Response<PaginatedResult<DistributivoDTO>>>,
    IRequestHandler<GetDistributivoByCicloQuery, Response<IEnumerable<DistributivoDTO>>>,
    IRequestHandler<GetCargaDocenteQuery, Response<CargaDocenteDTO>>,
    IRequestHandler<GetDocentesDisponiblesQuery, Response<IEnumerable<DocenteDisponibleDTO>>>,
    IRequestHandler<DesactivarDistributivoCommand, Response<bool>>,
    IRequestHandler<ActivarDistributivoCommand, Response<bool>>,
    IRequestHandler<ClonarDistributivosCommand, Response<int>>,
    IRequestHandler<GetSlotsSinDocenteByMallaQuery, Response<IEnumerable<DistributivoDTO>>>,
    IRequestHandler<GetDistributivoFiltradoQuery, Response<PaginatedResult<DistributivoDTO>>>,
    IRequestHandler<GetCargaDocenteByDocumentoQuery, Response<CargaDocenteDTO>>,
    IRequestHandler<GetDistributivoByCicloAgrupadoQuery, Response<IEnumerable<ParaleloConDistributivosDTO>>>
{
    private readonly IDistributivoRepository _repository;
    private readonly IGradeDeadlineService _deadlineService;

    public DistributivoHandler(IDistributivoRepository repository, IGradeDeadlineService deadlineService)
    {
        _repository = repository;
        _deadlineService = deadlineService;
    }

    public async Task<Response<bool>> Handle(CreateDistributivoMasivoCommand request, CancellationToken ct)
    {
        var entities = new List<Domain.Entities.Distributivo>();
        foreach (var idMallaParalelo in request.Data.IdsMallaParalelos)
        {
            if (await _repository.ExisteAsignacionAsync(request.Data.IdDetalleMalla, idMallaParalelo, null, ct))
                continue;

            entities.Add(new Domain.Entities.Distributivo
            {
                IdDetalleMalla = request.Data.IdDetalleMalla,
                IdPersona = request.Data.IdPersona,
                IdMallaParalelo = idMallaParalelo,
                Activo = true
            });
        }

        if (!entities.Any())
            return Response<bool>.Failure("No se crearon asignaciones. Verifique si ya existen o si los paralelos están inactivos.");

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

    public async Task<Response<IEnumerable<DistributivoDTO>>> Handle(GetDistributivoByCicloQuery request, CancellationToken ct)
    {
        var entities = await _repository.GetByCicloAsync(request.IdCiclo, ct);
        return Response<IEnumerable<DistributivoDTO>>.Success(entities.Select(MapToDTO), "Distributivos encontrados");
    }

    public async Task<Response<PaginatedResult<DistributivoDTO>>> Handle(GetDistributivoFiltradoQuery request, CancellationToken ct)
    {
        var totalCount = await _repository.CountFiltradoAsync(request.IdMalla, request.IdMallaParalelo, request.IdDetalleMalla, request.SoloActivos, ct);
        var entities = await _repository.GetFiltradoPagedAsync(request.IdMalla, request.IdMallaParalelo, request.IdDetalleMalla, request.SoloActivos, request.PageNumber, request.PageSize, ct);
        var result = new PaginatedResult<DistributivoDTO>(entities.Select(MapToDTO), totalCount, request.PageNumber, request.PageSize);
        return Response<PaginatedResult<DistributivoDTO>>.Success(result, "Distributivos encontrados");
    }

    public async Task<Response<CargaDocenteDTO>> Handle(GetCargaDocenteQuery request, CancellationToken ct)
    {
        var asignaciones = await _repository.GetByDocenteWithDetailsAsync(request.IdPersona, ct);
        asignaciones = asignaciones.Where(a => a.IdMallaParaleloNavigation?.IdMallaNavigation?.IdCicloNavigation?.EsActivo == true).ToList();

        if (!asignaciones.Any())
            return Response<CargaDocenteDTO>.Success(new CargaDocenteDTO { IdPersona = request.IdPersona }, "Sin asignaciones en el ciclo activo");

        var first = asignaciones.First().IdPersonaNavigation;
        var persona = first?.IdPersonaNavigation;

        return Response<CargaDocenteDTO>.Success(MapToCargaDTO(request.IdPersona, persona, asignaciones), "Carga docente generada");
    }

    public async Task<Response<CargaDocenteDTO>> Handle(GetCargaDocenteByDocumentoQuery request, CancellationToken ct)
    {
        var asignaciones = await _repository.GetByDocenteByDocumentoAsync(request.Documento, ct);
        asignaciones = asignaciones.Where(a => a.IdMallaParaleloNavigation?.IdMallaNavigation?.IdCicloNavigation?.EsActivo == true).ToList();

        if (!asignaciones.Any())
            return Response<CargaDocenteDTO>.Failure("No se encontró docente con ese documento o no tiene asignaciones en el ciclo activo.");

        var first = asignaciones.First();
        var persona = first.IdPersonaNavigation?.IdPersonaNavigation;
        var idPersona = first.IdPersona ?? 0;

        return Response<CargaDocenteDTO>.Success(MapToCargaDTO(idPersona, persona, asignaciones), "Carga docente generada");
    }

    private CargaDocenteDTO MapToCargaDTO(int idPersona, Persona? persona, IEnumerable<Domain.Entities.Distributivo> asignaciones)
    {
        var totalAlumnos = asignaciones
            .GroupBy(a => a.IdMallaParalelo)
            .Sum(g => g.First().IdMallaParaleloNavigation?.Matricula?.Count ?? 0);

        return new CargaDocenteDTO
        {
            IdPersona = idPersona,
            NombreDocente = persona != null ? $"{persona.PrimerNombre} {persona.PrimerApellido}".Trim() : string.Empty,
            DocumentoDocente = persona?.Documento ?? string.Empty,
            TotalMaterias = asignaciones.Select(a => a.IdDetalleMalla).Distinct().Count(),
            TotalParalelos = asignaciones.Select(a => a.IdMallaParalelo).Distinct().Count(),
            TotalAlumnos = totalAlumnos,
            TotalHoras = asignaciones.Sum(a => a.IdDetalleMallaNavigation?.IdMateriaNavigation?.HorasRequeridas ?? 0),
            Mallas = asignaciones.GroupBy(a => a.IdMallaParaleloNavigation?.IdMalla ?? 0)
                .Select(gMalla => new MallaCargaDTO
                {
                    IdMalla = gMalla.Key,
                    NombreMalla = gMalla.First().IdMallaParaleloNavigation?.IdMallaNavigation?.Detalle ?? string.Empty,
                    Materias = gMalla.GroupBy(a => a.IdDetalleMalla)
                        .Select(gMateria => new MateriaCargaDTO
                        {
                            IdDetalleMalla = gMateria.Key,
                            NombreMateria = gMateria.First().IdDetalleMallaNavigation?.IdMateriaNavigation?.Detalle ?? string.Empty,
                            Horas = gMateria.First().IdDetalleMallaNavigation?.IdMateriaNavigation?.HorasRequeridas ?? 0,
                            Modulo = gMateria.First().IdDetalleMallaNavigation?.Modulo,
                            FechaInicio = gMateria.First().IdDetalleMallaNavigation?.FechaInicio,
                            FechaFin = gMateria.First().IdDetalleMallaNavigation?.FechaFin,
                            DiasGracia = gMateria.First().IdDetalleMallaNavigation?.DiasGracia,
                            StatusPeriodo = _deadlineService.GetStatus(
                                gMateria.First().IdDetalleMallaNavigation?.FechaInicio,
                                gMateria.First().IdDetalleMallaNavigation?.FechaFin,
                                gMateria.First().IdDetalleMallaNavigation?.DiasGracia
                            ).ToString(),
                            Paralelos = gMateria.Select(a => new ParaleloCargaDTO
                            {
                                IdDistributivo = a.IdDistributivo,
                                IdMallaParalelo = a.IdMallaParalelo,
                                IdParalelo = a.IdMallaParaleloNavigation?.IdParalelo ?? 0,
                                NombreParalelo = a.IdMallaParaleloNavigation?.IdParaleloNavigation?.Detalle ?? string.Empty,
                                CantidadAlumnos = a.IdMallaParaleloNavigation?.Matricula?.Count ?? 0
                            }).ToList()
                        }).ToList()
                }).ToList()
        };
    }

    public async Task<Response<int>> Handle(CreateDistributivoCommand request, CancellationToken ct)
    {
        if (await _repository.ExisteAsignacionAsync(request.Data.IdDetalleMalla, request.Data.IdMallaParalelo, null, ct))
            return Response<int>.Failure("Ya existe una asignación activa para esta materia en este paralelo.");

        var entity = new Domain.Entities.Distributivo
        {
            IdDetalleMalla = request.Data.IdDetalleMalla,
            IdPersona = request.Data.IdPersona,
            IdMallaParalelo = request.Data.IdMallaParalelo,
            Activo = true
        };

        await _repository.AddAsync(entity, ct);
        return Response<int>.Success(entity.IdDistributivo, "Distributivo creado exitosamente");
    }

    public async Task<Response<bool>> Handle(UpdateDistributivoCommand request, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(request.Data.IdDistributivo, ct);
        if (entity == null) return Response<bool>.Failure("Distributivo no encontrado");

        if (entity.IdMallaParalelo != request.Data.IdMallaParalelo)
        {
            if (await _repository.TieneNotasAsync(entity.IdDetalleMalla, entity.IdMallaParalelo, ct))
                return Response<bool>.Failure("No se puede cambiar el paralelo de un distributivo que ya tiene notas registradas.");
        }

        entity.IdDetalleMalla = request.Data.IdDetalleMalla;
        entity.IdPersona = request.Data.IdPersona;
        entity.IdMallaParalelo = request.Data.IdMallaParalelo;
        entity.Activo = request.Data.Activo ?? entity.Activo;

        await _repository.UpdateAsync(entity, ct);
        return Response<bool>.Success(true, "Distributivo actualizado exitosamente");
    }

    public async Task<Response<bool>> Handle(DeleteDistributivoCommand request, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(request.Id, ct);
        if (entity == null) return Response<bool>.Failure("Distributivo no encontrado");

        if (await _repository.TieneNotasAsync(entity.IdDetalleMalla, entity.IdMallaParalelo, ct))
            return Response<bool>.Failure("No se puede eliminar un distributivo con notas registradas. Se recomienda desactivarlo.");

        var matriculados = await _repository.ContarAlumnosPorMallaParaleloAsync(entity.IdMallaParalelo, ct);
        if (matriculados > 0)
            return Response<bool>.Failure($"Existen {matriculados} alumnos matriculados en este paralelo. Se recomienda desactivar el distributivo en lugar de borrarlo.");

        await _repository.DeleteAsync(request.Id, ct);
        return Response<bool>.Success(true, "Distributivo eliminado exitosamente");
    }

    public async Task<Response<DistributivoConAlumnosDTO>> Handle(GetDistributivoByIdQuery request, CancellationToken ct)
    {
        var entity = await _repository.GetByIdConAlumnosAsync(request.Id, ct);
        if (entity == null) return Response<DistributivoConAlumnosDTO>.Failure("Distributivo no encontrado");
        return Response<DistributivoConAlumnosDTO>.Success(MapToDetalleDTO(entity), "Distributivo encontrado");
    }

    public async Task<Response<IEnumerable<DistributivoDTO>>> Handle(GetAllDistributivosQuery request, CancellationToken ct)
    {
        var list = await _repository.GetAllAsync(ct);
        return Response<IEnumerable<DistributivoDTO>>.Success(list.Select(MapToDTO), "Distributivos encontrados");
    }

    public async Task<Response<IEnumerable<DistributivoDTO>>> Handle(GetDistributivoByMallaParaleloQuery request, CancellationToken ct)
    {
        var list = await _repository.GetByMallaParaleloAsync(request.IdMallaParalelo, ct);
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
            AsignacionesActuales = d.AsignacionesActuales,
            TotalHoras = d.TotalHoras,
            TotalParalelos = d.TotalParalelos,
            TotalAlumnos = d.TotalAlumnos
        });
        return Response<IEnumerable<DocenteDisponibleDTO>>.Success(dtos, "Docentes disponibles encontrados");
    }

    public async Task<Response<bool>> Handle(DesactivarDistributivoCommand request, CancellationToken ct)
    {
        await _repository.DesactivarAsync(request.Id, ct);
        return Response<bool>.Success(true, "Distributivo desactivado exitosamente");
    }

    public async Task<Response<bool>> Handle(ActivarDistributivoCommand request, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(request.Id, ct);
        if (entity == null) return Response<bool>.Failure("Distributivo no encontrado");

        entity.Activo = true;
        await _repository.UpdateAsync(entity, ct);
        return Response<bool>.Success(true, "Distributivo reactivado exitosamente");
    }

    public async Task<Response<int>> Handle(ClonarDistributivosCommand request, CancellationToken ct)
    {
        var actuales = await _repository.GetActivosByMallaParaleloAsync(request.IdMallaParaleloOrigen, ct);
        if (!actuales.Any()) return Response<int>.Failure("No hay distributivos activos para clonar en el origen.");

        int creados = 0;
        foreach (var d in actuales)
        {
            if (await _repository.ExisteAsignacionAsync(d.IdDetalleMalla, request.IdMallaParaleloDestino, null, ct))
                continue;

            await _repository.AddAsync(new Domain.Entities.Distributivo
            {
                IdDetalleMalla = d.IdDetalleMalla,
                IdMallaParalelo = request.IdMallaParaleloDestino,
                IdPersona = d.IdPersona,
                Activo = true
            }, ct);
            creados++;
        }

        return Response<int>.Success(creados, $"{creados} distributivos clonados exitosamente");
    }

    public async Task<Response<IEnumerable<DistributivoDTO>>> Handle(GetSlotsSinDocenteByMallaQuery request, CancellationToken ct)
    {
        var list = await _repository.GetSlotsSinDocenteByMallaAsync(request.IdMalla, ct);
        return Response<IEnumerable<DistributivoDTO>>.Success(list.Select(MapToDTO), "Slots sin docente encontrados");
    }

    private DistributivoDTO MapToDTO(Domain.Entities.Distributivo entity)
    {
        if (entity == null) return new DistributivoDTO();

        var detalleMalla = entity.IdDetalleMallaNavigation;
        var materia = detalleMalla?.IdMateriaNavigation;
        var mp = entity.IdMallaParaleloNavigation;
        var malla = mp?.IdMallaNavigation ?? detalleMalla?.IdMallaNavigation;
        var ciclo = malla?.IdCicloNavigation;
        var tipoOferta = ciclo?.IdTipoOfertaNavigation;
        var paralelo = mp?.IdParaleloNavigation;
        var usuario = entity.IdPersonaNavigation;
        var persona = usuario?.IdPersonaNavigation;

        return new DistributivoDTO
        {
            IdDistributivo = entity.IdDistributivo,
            IdDetalleMalla = entity.IdDetalleMalla,
            IdPersona = entity.IdPersona,
            IdMallaParalelo = entity.IdMallaParalelo,
            IdParalelo = mp?.IdParalelo,
            IdMalla = malla?.IdMalla ?? 0,
            IdMateria = detalleMalla?.IdMateria ?? 0,
            NombreMateria = materia?.Detalle ?? string.Empty,
            HorasMateria = materia?.HorasRequeridas ?? 0,
            NombreMalla = malla?.Detalle ?? string.Empty,
            TipoOferta = tipoOferta?.Detalle ?? string.Empty,
            IdCiclo = malla?.IdCiclo ?? 0,
            NombreCiclo = ciclo?.Detalle ?? string.Empty,
            NombreParalelo = paralelo?.Detalle ?? string.Empty,
            CupoMaximo = mp?.CupoMaximo ?? 0,
            NombreDocente = persona != null ? $"{persona.PrimerNombre} {persona.PrimerApellido}".Trim() : "PENDIENTE ASIGNACIÓN",
            DocumentoDocente = persona?.Documento ?? string.Empty,
            CantidadAlumnos = mp?.Matricula?.Count ?? 0,
            EsActivo = entity.Activo,
            FechaInicio = detalleMalla?.FechaInicio,
            FechaFin = detalleMalla?.FechaFin,
            DiasGracia = detalleMalla?.DiasGracia,
            StatusPeriodo = _deadlineService.GetStatus(
                detalleMalla?.FechaInicio,
                detalleMalla?.FechaFin,
                detalleMalla?.DiasGracia
            ).ToString()
        };
    }

    private DistributivoConAlumnosDTO MapToDetalleDTO(Domain.Entities.Distributivo entity)
    {
        var base_ = MapToDTO(entity);
        var mp = entity.IdMallaParaleloNavigation;

        var alumnos = mp?.Matricula?.Select(m =>
        {
            var persona = m.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;
            return new AlumnoDistributivoDTO
            {
                IdMatricula = m.IdMatricula,
                IdUsuario = m.IdUsuarioAlumno,
                NombreCompleto = persona != null
                    ? $"{persona.PrimerNombre} {persona.SegundoNombre} {persona.PrimerApellido} {persona.SegundoApellido}".Trim()
                    : string.Empty,
                Documento = persona?.Documento ?? string.Empty,
                IdEstadoMatricula = m.IdEstadoMatricula,
                DetalleEstado = m.IdEstadoMatriculaNavigation?.Detalle ?? string.Empty
            };
        }).ToList() ?? new List<AlumnoDistributivoDTO>();

        return new DistributivoConAlumnosDTO
        {
            IdDistributivo = base_.IdDistributivo,
            IdDetalleMalla = base_.IdDetalleMalla,
            IdPersona = base_.IdPersona,
            IdMallaParalelo = base_.IdMallaParalelo,
            IdParalelo = base_.IdParalelo,
            IdMalla = base_.IdMalla,
            IdMateria = base_.IdMateria,
            NombreMateria = base_.NombreMateria,
            HorasMateria = base_.HorasMateria,
            NombreMalla = base_.NombreMalla,
            TipoOferta = base_.TipoOferta,
            IdCiclo = base_.IdCiclo,
            NombreCiclo = base_.NombreCiclo,
            NombreParalelo = base_.NombreParalelo,
            CupoMaximo = base_.CupoMaximo,
            NombreDocente = base_.NombreDocente,
            DocumentoDocente = base_.DocumentoDocente,
            CantidadAlumnos = base_.CantidadAlumnos,
            EsActivo = base_.EsActivo,
            Alumnos = alumnos
        };
    }

    public async Task<Response<IEnumerable<ParaleloConDistributivosDTO>>> Handle(GetDistributivoByCicloAgrupadoQuery request, CancellationToken ct)
    {
        var paralelos = await _repository.GetMallaParalelosByCicloAsync(request.IdCiclo, ct);

        var dtos = paralelos.Select(mp =>
        {
            var malla = mp.IdMallaNavigation;
            var ciclo = malla?.IdCicloNavigation;
            var tipoOferta = ciclo?.IdTipoOfertaNavigation;

            return new ParaleloConDistributivosDTO
            {
                IdMallaParalelo = mp.IdMallaParalelo,
                IdParalelo = mp.IdParalelo,
                NombreParalelo = mp.IdParaleloNavigation?.Detalle ?? string.Empty,
                CupoMaximo = mp.CupoMaximo,
                EsActivo = mp.EsActivo,
                CantidadAlumnos = mp.Matricula?.Count ?? 0,
                IdMalla = mp.IdMalla,
                NombreMalla = malla?.Detalle ?? string.Empty,
                TipoOferta = tipoOferta?.Detalle ?? string.Empty,
                IdCiclo = malla?.IdCiclo ?? 0,
                NombreCiclo = ciclo?.Detalle ?? string.Empty,
                Distributivos = mp.Distributivo?.Select(d =>
                {
                    var dm = d.IdDetalleMallaNavigation;
                    var materia = dm?.IdMateriaNavigation;
                    var persona = d.IdPersonaNavigation?.IdPersonaNavigation;

                    return new DistributivoItemDTO
                    {
                        IdDistributivo = d.IdDistributivo,
                        IdDetalleMalla = d.IdDetalleMalla,
                        IdMateria = dm?.IdMateria ?? 0,
                        NombreMateria = materia?.Detalle ?? string.Empty,
                        HorasMateria = materia?.HorasRequeridas ?? 0,
                        IdPersona = d.IdPersona,
                        NombreDocente = persona != null
                            ? $"{persona.PrimerNombre} {persona.PrimerApellido}".Trim()
                            : "PENDIENTE ASIGNACIÓN",
                        DocumentoDocente = persona?.Documento ?? string.Empty,
                        EsActivo = d.Activo,
                        FechaInicio = dm?.FechaInicio,
                        FechaFin = dm?.FechaFin,
                        DiasGracia = dm?.DiasGracia,
                        StatusPeriodo = _deadlineService.GetStatus(
                            dm?.FechaInicio,
                            dm?.FechaFin,
                            dm?.DiasGracia
                        ).ToString()
                    };
                }).ToList() ?? new List<DistributivoItemDTO>()
            };
        });

        return Response<IEnumerable<ParaleloConDistributivosDTO>>.Success(dtos, "Distributivos agrupados por paralelo");
    }

    private static AsignacionDocenteDTO MapToAsignacionDTO(Domain.Entities.Distributivo entity) => new()
    {
        IdDistributivo = entity.IdDistributivo,
        IdDetalleMalla = entity.IdDetalleMalla,
        IdMallaParalelo = entity.IdMallaParalelo,
        NombreMateria = entity.IdDetalleMallaNavigation?.IdMateriaNavigation?.Detalle ?? string.Empty,
        NombreParalelo = entity.IdMallaParaleloNavigation?.IdParaleloNavigation?.Detalle ?? string.Empty,
        IdPlantillaEvaluacion = entity.IdDetalleMallaNavigation?.IdPlantillaEvaluacion ?? 0,
        NombrePlantilla = entity.IdDetalleMallaNavigation?.IdPlantillaEvaluacionNavigation?.Nombre ?? string.Empty,
        CantidadAlumnos = entity.IdMallaParaleloNavigation?.Matricula?.Count ?? 0
    };
}
