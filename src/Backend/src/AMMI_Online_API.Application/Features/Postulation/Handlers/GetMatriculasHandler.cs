using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class GetMatriculasHandler : IRequestHandler<GetMatriculasQuery, Response<PaginatedResult<MatriculaDTO>>>
{
    private readonly IMatriculaRepository _repository;

    public GetMatriculasHandler(IMatriculaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<PaginatedResult<MatriculaDTO>>> Handle(GetMatriculasQuery request, CancellationToken cancellationToken)
    {
        var totalCount = await _repository.CountAllMatriculasAsync(cancellationToken);
        var matriculas = await _repository.GetAllMatriculasPagedAsync(request.PageNumber, request.PageSize, cancellationToken);

        var dtoList = matriculas.Select(m => {
            var detalleTipoOferta = m.DetalleMatricula
                .Select(dm => dm.IdDetalleMallaNavigation?
                    .IdMallaNavigation?
                    .IdTipoOfertaNavigation?
                    .Detalle)
                .FirstOrDefault(d => d != null);
            var detalleMalla = m.DetalleMatricula
                .Select(dm => dm.IdDetalleMallaNavigation?
                                .IdMallaNavigation)
                .FirstOrDefault(d => d != null);

            var persona = m.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;

            var detalleCiclo = m.Credito
                .Select(c => c.IdEspecieCicloNavigation?.IdCicloNavigation?.Detalle)
                .FirstOrDefault(d => d != null);

            return new MatriculaDTO
            {
                IdMatricula = m.IdMatricula,
                IdMalla = detalleMalla?.IdMalla ?? 0,
                DetalleMalla = detalleMalla?.Detalle ?? string.Empty,
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
        }).ToList();

        var result = new PaginatedResult<MatriculaDTO>(dtoList, totalCount, request.PageNumber, request.PageSize);
        return new Response<PaginatedResult<MatriculaDTO>>(result);
    }
}

public class GetMatriculasDatosFaltantesPersonaHandler : IRequestHandler<GetMatriculasDatosFaltantesPersonaQuery, Response<IEnumerable<MatriculaFaltantesDTO>>>
{
    private readonly IMatriculaRepository _repository;

    public GetMatriculasDatosFaltantesPersonaHandler(IMatriculaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<MatriculaFaltantesDTO>>> Handle(
        GetMatriculasDatosFaltantesPersonaQuery request,
        CancellationToken cancellationToken)
    {
        var matriculas = await _repository.GetAllMatriculasWithPersonaDetailsAsync(cancellationToken);
        var resultados = new List<MatriculaFaltantesDTO>();
        var totalTablasPersona = 7; // DatosContacto, PersonaDireccion, DocumentosPersonales, PersonaInfo, 
                                    // PersonaNacionalidad, PersonaActividadEconomica, PersonaDiscapacidad, PersonaAlergias

        foreach (var matricula in matriculas)
        {
            var persona = matricula.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;

            if (persona == null)
            {
                resultados.Add(new MatriculaFaltantesDTO
                {
                    IdMatricula = matricula.IdMatricula,
                    DatosFaltantes = totalTablasPersona, // Si no hay persona, todas las tablas faltan
                });
                continue;
            }
            var tablasExistentes = 0;
            if (persona.DatosContacto?.Any() ?? false) tablasExistentes++;                // Tabla DatosContacto
            if (persona.PersonaDireccion?.Any() ?? false) tablasExistentes++;             // Tabla PersonaDireccion
            if (persona.DocumentosPersonales?.Any() ?? false) tablasExistentes++;         // Tabla DocumentosPersonales
            if (persona.PersonaInfo != null) tablasExistentes++;                          // Tabla PersonaInfo (1:1)
            if (persona.PersonaNacionalidad?.Any() ?? false) tablasExistentes++;          // Tabla PersonaNacionalidad
            if (persona.PersonaActividadEconomica?.Any() ?? false) tablasExistentes++;    // Tabla PersonaActividadEconomica
            if (persona.PersonaDiscapacidad?.Any() ?? false) tablasExistentes++;          // Tabla PersonaDiscapacidad

            // DatosFaltantes = Total de tablas - Tablas que existen
            var datosFaltantes = totalTablasPersona - tablasExistentes;
            

            // 1. Datos basicos de Persona (3 campos)
            if (string.IsNullOrWhiteSpace(persona.PrimerNombre)) datosFaltantes++;
            if (string.IsNullOrWhiteSpace(persona.PrimerApellido)) datosFaltantes++;
            if (string.IsNullOrWhiteSpace(persona.Documento)) datosFaltantes++;

            // 2. Datos de contacto (3 verificaciones)
            var tieneDatosContacto = persona.DatosContacto?.Any() ?? false;
            if (!tieneDatosContacto)
            {
                datosFaltantes += 3; // Si no hay ning�n contacto, faltan email, tel�fono y al menos uno
            }
            else
            {
                var tiposContacto = persona.DatosContacto
                    .Where(dc => !string.IsNullOrWhiteSpace(dc.Detalle))
                    .Select(dc => dc.IdTipoDatoContactoNavigation?.Detalle?.ToLower())
                    .ToList();

                var tieneEmail = tiposContacto.Any(t => t != null && t.Contains("email"));
                var tieneTelefono = tiposContacto.Any(t => t != null && (t.Contains("tel") || t.Contains("cel")));
                var tieneOtroContacto = persona.DatosContacto.Count > 2; // Si tiene m�s de 2, tiene otro tipo

                if (!tieneEmail) datosFaltantes++;
                if (!tieneTelefono) datosFaltantes++;
                if (!tieneOtroContacto && persona.DatosContacto.Count < 3) datosFaltantes++;
            }

            // 3. Direcci�n (1 campo)
            if (!(persona.PersonaDireccion?.Any() ?? false)) datosFaltantes++;

            // 4. Documentos personales (1 campo)
            if (!(persona.DocumentosPersonales?.Any() ?? false)) datosFaltantes++;

            // 5. Datos adicionales (1 campo)
            if (persona.PersonaInfo == null) datosFaltantes++;

            // 6. Nacionalidad (1 campo)
            if (!(persona.PersonaNacionalidad?.Any() ?? false)) datosFaltantes++;

            // 7. Actividad econ�mica (1 campo)
            if (!(persona.PersonaActividadEconomica?.Any() ?? false)) datosFaltantes++;

            // 8. Discapacidad (1 campo) - Consideramos que si no tiene discapacidad, no es dato faltante
            // Pero si tiene, deber�a estar registrado
            var tieneDiscapacidad = persona.PersonaDiscapacidad?.Any() ?? false;
            // No contamos como faltante si no tiene discapacidad

            // 9. Alergias (1 campo) - Similar a discapacidad
            var tieneAlergias = persona.PersonaAlergias?.Any() ?? false;
            // No contamos como faltante si no tiene alergias

            resultados.Add(new MatriculaFaltantesDTO
            {
                IdMatricula = matricula.IdMatricula,
                DatosFaltantes = datosFaltantes,
            });
        }

        return new Response<IEnumerable<MatriculaFaltantesDTO>>(resultados);
    }
}

public class GetMatriculasByMallaHandler : IRequestHandler<GetMatriculasByMallaQuery, Response<PaginatedResult<MatriculaDTO>>>
{
    private readonly IMatriculaRepository _repository;

    public GetMatriculasByMallaHandler(IMatriculaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<PaginatedResult<MatriculaDTO>>> Handle(GetMatriculasByMallaQuery request, CancellationToken cancellationToken)
    {
        var totalCount = await _repository.CountByMallaAsync(request.IdMalla, cancellationToken);
        var matriculas = await _repository.GetByMallaPagedAsync(request.IdMalla, request.PageNumber, request.PageSize, cancellationToken);

        var dtoList = matriculas.Select(m => {
            var detalleTipoOferta = m.DetalleMatricula
                .Select(dm => dm.IdDetalleMallaNavigation?
                    .IdMallaNavigation?
                    .IdTipoOfertaNavigation?
                    .Detalle)
                .FirstOrDefault(d => d != null);
            var detalleMalla = m.DetalleMatricula
                .Select(dm => dm.IdDetalleMallaNavigation?
                                .IdMallaNavigation)
                .FirstOrDefault(d => d != null);

            var persona = m.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;

            var detalleCiclo = m.Credito
                .Select(c => c.IdEspecieCicloNavigation?.IdCicloNavigation?.Detalle)
                .FirstOrDefault(d => d != null);

            return new MatriculaDTO
            {
                IdMatricula = m.IdMatricula,
                IdMalla = detalleMalla?.IdMalla ?? 0,
                DetalleMalla = detalleMalla?.Detalle ?? string.Empty,
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
        }).ToList();

        var result = new PaginatedResult<MatriculaDTO>(dtoList, totalCount, request.PageNumber, request.PageSize);
        return new Response<PaginatedResult<MatriculaDTO>>(result);
    }
}