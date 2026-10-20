using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class MatriculaExtensionsHandler :
    IRequestHandler<GetMatriculasByParaleloQuery, Response<IEnumerable<MatriculaDTO>>>,
    IRequestHandler<GetMatriculasByAlumnoQuery, Response<IEnumerable<MatriculaDTO>>>,
    IRequestHandler<GetHistorialAcademicoQuery, Response<HistorialAcademicoDTO>>
{
    private readonly IMatriculaRepository _repository;

    public MatriculaExtensionsHandler(IMatriculaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<MatriculaDTO>>> Handle(GetMatriculasByParaleloQuery request, CancellationToken ct)
    {
        var list = await _repository.GetByParaleloAsync(request.IdParalelo, ct);

        var dtoList = list.Select(m => {
            var detalleTipoOferta = m.DetalleMatricula
                .Select(dm => dm.IdDetalleMallaNavigation?
                    .IdMallaNavigation?
                    .IdTipoOfertaNavigation?
                    .Detalle)
                .FirstOrDefault(d => d != null);

            var persona = m.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;

            var detalleCiclo = m.Credito
                .Select(c => c.IdEspecieCicloNavigation?.IdCicloNavigation?.Detalle)
                .FirstOrDefault(d => d != null);

            return new MatriculaDTO
            {
                IdMatricula = m.IdMatricula,
                IdUsuarioAlumno = m.IdUsuarioAlumno,
                EsFinalizada = m.EsFinalizada,
                DetalleParalelo = m.IdParaleloNavigation?.NombreParalelo ?? string.Empty,
                DetalleTipoOferta = detalleTipoOferta ?? string.Empty,
                PrimerNombre = persona?.PrimerNombre ?? string.Empty,
                PrimerApellido = persona?.PrimerApellido ?? string.Empty,
                SegundoNombre = persona?.SegundoNombre ?? string.Empty,
                SegundoApellido = persona?.SegundoApellido ?? string.Empty,
                NumeroDocumento = persona?.Documento ?? string.Empty,
                DetalleCiclo = detalleCiclo ?? string.Empty
            };
        });

        return Response<IEnumerable<MatriculaDTO>>.Success(dtoList, "Matriculas del paralelo encontradas");
    }

    public async Task<Response<IEnumerable<MatriculaDTO>>> Handle(GetMatriculasByAlumnoQuery request, CancellationToken ct)
    {
        var matriculas = await _repository.GetByAlumnoWithDetailsAsync(request.IdUsuario, ct);
        
        var dtoList = matriculas.Select(m => {
            // Navegar para obtener el detalle de TipoOferta
            var detalleTipoOferta = m.DetalleMatricula
                .Select(dm => dm.IdDetalleMallaNavigation?
                    .IdMallaNavigation?
                    .IdTipoOfertaNavigation?
                    .Detalle)
                .FirstOrDefault(d => d != null);

            var persona = m.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;

            var detalleCiclo = m.Credito
                .Select(c => c.IdEspecieCicloNavigation?.IdCicloNavigation?.Detalle)
                .FirstOrDefault(d => d != null);

            return new MatriculaDTO
            {
                IdMatricula = m.IdMatricula,
                IdUsuarioAlumno = m.IdUsuarioAlumno,
                DetalleParalelo = m.IdParaleloNavigation?.NombreParalelo ?? string.Empty,
                EsFinalizada = m.EsFinalizada,
                DetalleTipoOferta = detalleTipoOferta ?? string.Empty,
                PrimerNombre = persona?.PrimerNombre ?? string.Empty,
                PrimerApellido = persona?.PrimerApellido ?? string.Empty,
                SegundoNombre = persona?.SegundoNombre ?? string.Empty,
                SegundoApellido = persona?.SegundoApellido ?? string.Empty,
                NumeroDocumento = persona?.Documento ?? string.Empty,
                DetalleCiclo = detalleCiclo ?? string.Empty
            };
        });

        return Response<IEnumerable<MatriculaDTO>>.Success(dtoList, "Matriculas encontradas");
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
                TipoOferta = mallaEntity.IdTipoOfertaNavigation?.Detalle ?? string.Empty,
                Ciclos = new List<CicloHistorialDTO>()
            };

            // Group by Matricula (which represents a Cycle usually)
            var matriculasInMalla = mGroup.Select(x => x.Matricula).DistinctBy(m => m.IdMatricula);

            foreach (var mat in matriculasInMalla)
            {
                // Identify cycle from Credito
                var ciclo = mat.Credito.FirstOrDefault()?.IdEspecieCicloNavigation?.IdCicloNavigation;
                
                var cicloDTO = new CicloHistorialDTO
                {
                    IdCiclo = ciclo?.IdCiclo ?? 0,
                    NombreCiclo = ciclo?.Detalle ?? "Ciclo Desconocido",
                    IdMatricula = mat.IdMatricula,
                    FechaInicio = ciclo?.FechaInicioEstimada,
                    FechaFin = ciclo?.FechaFinEstimada,
                    Materias = new List<MateriaHistorialDTO>()
                };

                // Add materias from this matricula regardless of Malla? 
                // Only those belonging to THIS Malla in case of mixed (unlikely)
                var materias = mat.DetalleMatricula
                    .Where(dm => dm.IdDetalleMallaNavigation?.IdMalla == mallaDTO.IdMalla)
                    .Select(dm => new MateriaHistorialDTO
                    {
                        IdDetalleMalla = dm.IdDetalleMalla,
                        NombreMateria = dm.IdDetalleMallaNavigation?.IdMateriaNavigation?.Detalle ?? string.Empty,
                        NotaFinal = dm.NotaFinal,
                        ExamenRemedial = dm.ExamenRemedial,
                        Estado = dm.Aprobado.HasValue
                            ? (dm.Aprobado.Value ? "Aprobado" : (mat.EsFinalizada ? "Reprobado" : "En Curso"))
                            : (mat.EsFinalizada ? "Reprobado" : "En Curso")
                        //NotaFinal = GetNotaFinal(mat, dm.IdDetalleMalla), // Logic to get final note
                        //Estado = GetEstadoMateria(mat, dm.IdDetalleMalla)
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


    private static MatriculaConDetalleDTO MapToDetalleDTO(Matricula m)
    {
        // Infer Cycle and Malla from first detail/credit
        var malla = m.DetalleMatricula.FirstOrDefault()?.IdDetalleMallaNavigation?.IdMallaNavigation;
        var ciclo = m.Credito.FirstOrDefault()?.IdEspecieCicloNavigation?.IdCicloNavigation;

        return new MatriculaConDetalleDTO
        {
            IdMatricula = m.IdMatricula,
            IdUsuarioAlumno = m.IdUsuarioAlumno,
            IdParalelo = m.IdParalelo,
            EsFinalizada = m.EsFinalizada,
            NombreParalelo = m.IdParaleloNavigation?.NombreParalelo ?? string.Empty,
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
                       : dm.Aprobado == false ? (m.EsFinalizada ? "Reprobado" : "En Curso")
                       : m.EsFinalizada ? "Reprobado"
                       : "En Curso"
            }).ToList()
        };
    }
}
