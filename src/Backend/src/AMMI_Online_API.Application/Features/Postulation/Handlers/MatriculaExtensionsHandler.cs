using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class MatriculaExtensionsHandler :
    IRequestHandler<GetMatriculasByMallaParaleloQuery, Response<IEnumerable<MatriculaDTO>>>,
    IRequestHandler<GetMatriculasByAlumnoQuery, Response<IEnumerable<MatriculaDTO>>>,
    IRequestHandler<GetHistorialAcademicoQuery, Response<HistorialAcademicoDTO>>
{
    private readonly IMatriculaRepository _repository;
    private readonly IGradeDeadlineService _deadlineService;

    public MatriculaExtensionsHandler(IMatriculaRepository repository, IGradeDeadlineService deadlineService)
    {
        _repository = repository;
        _deadlineService = deadlineService;
    }

    public async Task<Response<IEnumerable<MatriculaDTO>>> Handle(GetMatriculasByMallaParaleloQuery request, CancellationToken ct)
    {
        var list = await _repository.GetByMallaParaleloAsync(request.IdMallaParalelo, ct);

        var dtoList = list.Select(m => MapToMatriculaDTO(m));

        return Response<IEnumerable<MatriculaDTO>>.Success(dtoList, "Matrículas del paralelo encontradas");
    }

    public async Task<Response<IEnumerable<MatriculaDTO>>> Handle(GetMatriculasByAlumnoQuery request, CancellationToken ct)
    {
        var matriculas = await _repository.GetByAlumnoWithDetailsAsync(request.IdUsuario, ct);
        var dtoList = matriculas.Select(MapToMatriculaDTO);
        return Response<IEnumerable<MatriculaDTO>>.Success(dtoList, "Matrículas encontradas");
    }

    public async Task<Response<HistorialAcademicoDTO>> Handle(GetHistorialAcademicoQuery request, CancellationToken ct)
    {
        var matriculas = await _repository.GetByAlumnoWithDetailsAsync(request.IdUsuario, ct);
        if (!matriculas.Any()) return Response<HistorialAcademicoDTO>.Failure("No se encontraron registros academicos");

        var first = matriculas.First();
        var persona = first.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;

        var historial = new HistorialAcademicoDTO
        {
            IdUsuario = request.IdUsuario,
            NombreAlumno = persona != null ? $"{persona.PrimerNombre} {persona.PrimerApellido}" : string.Empty,
            NumeroDocumento = persona?.Documento ?? string.Empty,
            Mallas = new List<MallaHistorialDTO>()
        };

        // Group by Malla
        // Malla can be derived from DetalleMatricula -> DetalleMalla -> Malla
        var mallasGroup = matriculas
            .SelectMany(m => m.DetalleMatricula.Select(dm => new { 
                Matricula = m, 
                Detalle = dm, 
                Malla = dm.IdDetalleMallaNavigation?.IdMallaNavigation 
            }))
            .Where(x => x.Malla != null)
            .GroupBy(x => x.Malla!.IdMalla);

        foreach (var mGroup in mallasGroup)
        {
            var mallaEntity = mGroup.First().Malla!;
            var mallaDTO = new MallaHistorialDTO
            {
                IdMalla = mallaEntity.IdMalla,
                NombreMalla = mallaEntity.Detalle,
                TipoOferta = mallaEntity.IdCicloNavigation?.IdTipoOfertaNavigation?.Detalle ?? string.Empty,
                Ciclos = new List<CicloHistorialDTO>()
            };

            // Group by Matricula (which represents a Cycle usually)
            var matriculasInMalla = mGroup.Select(x => x.Matricula).DistinctBy(m => m.IdMatricula);

            foreach (var mat in matriculasInMalla)
            {
                // Identify cycle from Credito
                var ciclo = mat.Credito.FirstOrDefault()?.IdEspecieCicloNavigation?.IdMallaNavigation?.IdCicloNavigation;
                
                var cicloDTO = new CicloHistorialDTO
                {
                    IdCiclo = ciclo?.IdCiclo ?? 0,
                    NombreCiclo = ciclo?.Detalle ?? "Ciclo Desconocido",
                    NombreParalelo = mat.IdMallaParaleloNavigation?.IdParaleloNavigation?.Detalle,
                    IdMatricula = mat.IdMatricula,
                    FechaInicio = ciclo?.FechaInicioEstimada,
                    FechaFin = ciclo?.FechaFinEstimada,
                    Materias = new List<MateriaHistorialDTO>()
                };

                // Add materias from this matricula
                var materias = mat.DetalleMatricula
                    .Where(dm => dm.IdDetalleMallaNavigation?.IdMalla == mallaDTO.IdMalla)
                    .Select(dm => {
                        var dmNav = dm.IdDetalleMallaNavigation;
                        var dist = dmNav?.Distributivo?.FirstOrDefault(d => d.IdMallaParalelo == mat.IdMallaParalelo && (d.Activo == null || d.Activo == true))
                                   ?? dmNav?.Distributivo?.FirstOrDefault(d => d.Activo == null || d.Activo == true);
                        var docPersona = dist?.IdPersonaNavigation?.IdPersonaNavigation;
                        var nombreDocente = docPersona != null
                            ? $"{docPersona.PrimerNombre} {docPersona.PrimerApellido}".Trim()
                            : null;
                        var emailDocente = dist?.IdPersonaNavigation?.Username;

                        return new MateriaHistorialDTO
                        {
                            IdDetalleMalla = dm.IdDetalleMalla,
                            IdDetalleMatricula = dm.IdDetalleMatricula,
                            IdPlantillaEvaluacion = dmNav?.IdPlantillaEvaluacion,
                            NombreMateria = dmNav?.IdMateriaNavigation?.Detalle ?? string.Empty,
                            NotaFinal = dm.NotaFinal,
                            ExamenRemedial = dm.ExamenRemedial,
                            Estado = dm.Aprobado.HasValue
                                ? (dm.Aprobado.Value ? "Aprobado" : (mat.IdEstadoMatriculaNavigation?.Completado == true ? "Reprobado" : "En Curso"))
                                : (mat.IdEstadoMatriculaNavigation?.Completado == true ? "Reprobado" : "En Curso"),
                            Docente = nombreDocente,
                            EmailDocente = emailDocente,
                            FechaInicio = dmNav?.FechaInicio ?? ciclo?.FechaInicioEstimada,
                            FechaFin = dmNav?.FechaFin ?? ciclo?.FechaFinEstimada,
                            DuracionHoras = dmNav?.DuracionHoras ?? (dmNav?.IdMateriaNavigation != null ? (int?)dmNav.IdMateriaNavigation.HorasRequeridas : null),
                            Modulo = dmNav?.Modulo,
                            AreaCompetencia = dmNav?.IdAreaCompetenciaNavigation?.Detalle,
                            DiasGracia = dmNav?.DiasGracia,
                            StatusPeriodo = _deadlineService.GetStatus(
                                dmNav?.FechaInicio ?? ciclo?.FechaInicioEstimada,
                                dmNav?.FechaFin ?? ciclo?.FechaFinEstimada,
                                dmNav?.DiasGracia
                            ).ToString(),
                            PeriodoActivo = _deadlineService.CanSubmitGrades(
                                dmNav?.FechaInicio ?? ciclo?.FechaInicioEstimada,
                                dmNav?.FechaFin ?? ciclo?.FechaFinEstimada,
                                dmNav?.DiasGracia
                            ),
                            MensajePeriodo = _deadlineService.GetStatusMessage(
                                dmNav?.FechaInicio ?? ciclo?.FechaInicioEstimada,
                                dmNav?.FechaFin ?? ciclo?.FechaFinEstimada,
                                dmNav?.DiasGracia
                            )
                        };
                    }).ToList();

                cicloDTO.Materias = materias;
                // Promedio
                if (materias.Any(m => m.NotaFinal.HasValue))
                    cicloDTO.PromedioGeneral = materias.Where(m => m.NotaFinal.HasValue).Average(m => m.NotaFinal!.Value);

                mallaDTO.Ciclos.Add(cicloDTO);
            }

            historial.Mallas.Add(mallaDTO);
        }

        return Response<HistorialAcademicoDTO>.Success(historial, "Historial generado");
    }


    private static MatriculaDTO MapToMatriculaDTO(Matricula m)
    {
        var detalleTipoOferta = m.DetalleMatricula
            .Select(dm => dm.IdDetalleMallaNavigation?.IdMallaNavigation?.IdCicloNavigation?.IdTipoOfertaNavigation?.Detalle)
            .FirstOrDefault(d => d != null);

        var detalleMalla = m.DetalleMatricula
            .Select(dm => dm.IdDetalleMallaNavigation?.IdMallaNavigation)
            .FirstOrDefault(d => d != null);

        var persona = m.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;

        var detalleCiclo = m.Credito
            .Select(c => c.IdEspecieCicloNavigation?.IdMallaNavigation?.IdCicloNavigation?.Detalle)
            .FirstOrDefault(d => d != null);

        return new MatriculaDTO
        {
            IdMatricula = m.IdMatricula,
            IdMalla = detalleMalla?.IdMalla ?? 0,
            DetalleMalla = detalleMalla?.Detalle ?? string.Empty,
            IdUsuarioAlumno = m.IdUsuarioAlumno,
            IdMallaParalelo = m.IdMallaParalelo,
            DetalleParalelo = m.IdMallaParaleloNavigation?.IdParaleloNavigation?.Detalle ?? string.Empty,
            IdEstadoMatricula = m.IdEstadoMatricula,
            DetalleEstado = m.IdEstadoMatriculaNavigation?.Detalle ?? string.Empty,
            EstadoCompletado = m.IdEstadoMatriculaNavigation?.Completado ?? false,
            DetalleTipoOferta = detalleTipoOferta ?? string.Empty,
            PrimerNombre = persona?.PrimerNombre ?? string.Empty,
            PrimerApellido = persona?.PrimerApellido ?? string.Empty,
            SegundoNombre = persona?.SegundoNombre ?? string.Empty,
            SegundoApellido = persona?.SegundoApellido ?? string.Empty,
            NumeroDocumento = persona?.Documento ?? string.Empty,
            DetalleCiclo = detalleCiclo ?? string.Empty
        };
    }

    private static MatriculaConDetalleDTO MapToDetalleDTO(Matricula m)
    {
        var malla = m.DetalleMatricula.FirstOrDefault()?.IdDetalleMallaNavigation?.IdMallaNavigation;
        var ciclo = m.Credito.FirstOrDefault()?.IdEspecieCicloNavigation?.IdMallaNavigation?.IdCicloNavigation;
        var estadoCompletado = m.IdEstadoMatriculaNavigation?.Completado ?? false;

        return new MatriculaConDetalleDTO
        {
            IdMatricula = m.IdMatricula,
            IdUsuarioAlumno = m.IdUsuarioAlumno,
            IdMallaParalelo = m.IdMallaParalelo,
            IdEstadoMatricula = m.IdEstadoMatricula,
            DetalleEstado = m.IdEstadoMatriculaNavigation?.Detalle ?? string.Empty,
            NombreParalelo = m.IdMallaParaleloNavigation?.IdParaleloNavigation?.Detalle ?? string.Empty,
            IdMalla = malla?.IdMalla ?? 0,
            NombreMalla = malla?.Detalle ?? string.Empty,
            IdCiclo = ciclo?.IdCiclo ?? 0,
            NombreCiclo = ciclo?.Detalle ?? string.Empty,
            FechaInicio = ciclo?.FechaInicioEstimada,
            FechaFin = ciclo?.FechaFinEstimada,
            Materias = m.DetalleMatricula.Select(dm => new DetalleMateriaInscritaDTO
            {
                IdDetalleMatricula = dm.IdDetalleMatricula,
                IdDetalleMalla = dm.IdDetalleMalla,
                NombreMateria = dm.IdDetalleMallaNavigation?.IdMateriaNavigation?.Detalle ?? string.Empty,
                NotaFinal = dm.NotaFinal,
                ExamenRemedial = dm.ExamenRemedial,
                Estado = dm.Aprobado == true ? "Aprobado"
                       : dm.Aprobado == false ? (estadoCompletado ? "Reprobado" : "En Curso")
                       : estadoCompletado ? "Reprobado"
                       : "En Curso"
            }).ToList()
        };
    }
}
