using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class ActualizarPostulacionContactoHandler : IRequestHandler<ActualizarPostulacionContactoCommand, Response<int>>
{
    private readonly IPersonaPostulacion _personaPostulacionRepository;
    private readonly ICicloService _cicloService;

    public ActualizarPostulacionContactoHandler(
        IPersonaPostulacion personaPostulacionRepository,
        ICicloService cicloService)
    {
        _personaPostulacionRepository = personaPostulacionRepository;
        _cicloService = cicloService;
    }

    public async Task<Response<int>> Handle(ActualizarPostulacionContactoCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.PersonaPostulacionManualJson))
                throw new Exception("El campo PersonaPostulacionManualJson es requerido");

            ActualizarPostulacionContactoDTO? data;
            try
            {
                data = JsonSerializer.Deserialize<ActualizarPostulacionContactoDTO>(
                    request.PersonaPostulacionManualJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (JsonException ex)
            {
                throw new Exception($"Error al deserializar el JSON: {ex.Message}");
            }

            if (data == null)
                throw new Exception("Datos inválidos");

            var archivoDiscapacidad = request.ArchivoDiscapacidad;
            var archivosDocumentos = request.ArchivosDocumentos ?? new List<IFormFile>();

            var documentosRequierenArchivo = data.DocumentosPersonales
                .Select(d => d.TieneArchivo)
                .ToList();

            var documentosConArchivoCount = data.DocumentosPersonales.Count(d => d.TieneArchivo);
            var archivosRecibidos = archivosDocumentos.Count;

            if (documentosConArchivoCount != archivosRecibidos)
                throw new Exception(
                    $"Inconsistencia en archivos. Documentos que requieren archivo: {documentosConArchivoCount}, " +
                    $"Archivos recibidos: {archivosRecibidos}");

            // Validar el ciclo de la malla
            var cicloMalla = await _cicloService.ObtenerCicloPorMallaAsync(data.IdMalla, cancellationToken);
            if (cicloMalla == null)
                throw new Exception($"No se encontró un ciclo asociado a la Malla ID {data.IdMalla}.");
            if (!cicloMalla.EsActivo)
                throw new Exception($"El ciclo '{cicloMalla.Detalle}' asociado a la malla no está activo.");

            // Mapear entidades
            var persona = new Persona
            {
                IdTipoDocumento = data.IdTipoDocumento,
                Documento = data.Documento,
                IdGenero = data.IdGenero,
                PrimerNombre = data.PrimerNombre,
                SegundoNombre = data.SegundoNombre,
                PrimerApellido = data.PrimerApellido,
                SegundoApellido = data.SegundoApellido,
                Activo = true
            };

            var personaInfo = new PersonaInfo
            {
                FechaNacimiento = data.FechaNacimiento,
                IdEstadoCivil = data.IdEstadoCivil,
                IdNacionalidadEtnica = data.IdNacionalidadEtnica,
            };

            var datosContacto = data.DatosContactos.Select(dc => new DatosContacto
            {
                IdTipoDatoContacto = dc.IdTipoDatoContacto,
                Detalle = dc.Detalle,
                EsPrincipal = dc.EsPrincipal
            }).ToList();

            var direccion = new PersonaDireccion
            {
                IdParroquia = data.IdParroquia,
                DireccionDomiciliaria = data.DireccionDomiciliaria,
                Activo = true
            };

            PersonaActividadEconomica? actividadEconomica = null;
            if (data.IdTipoActividadEconomica.HasValue && data.Valor.HasValue)
            {
                actividadEconomica = new PersonaActividadEconomica
                {
                    IdTipoActividadEconomica = data.IdTipoActividadEconomica.Value,
                    Valor = data.Valor,
                    EsPrincipal = data.EsPrincipal ?? false,
                    Activo = data.Activo ?? true
                };
            }

            PersonaDiscapacidad? discapacidad = null;
            if (data.IdTipoDiscapacidad.HasValue && data.Porcentaje.HasValue)
            {
                discapacidad = new PersonaDiscapacidad
                {
                    Porcentaje = data.Porcentaje.Value,
                    Recomendaciones = data.Recomendaciones,
                    IdTipoDiscapacidad = data.IdTipoDiscapacidad.Value
                };
            }

            var nacionalidad = new PersonaNacionalidad
            {
                IdPais = data.IdPais,
                Nacio = data.Nacio
            };

            var documentosPersonales = data.DocumentosPersonales.Select(doc => new DocumentosPersonales
            {
                IdTipoDocumentoPersonal = doc.IdTipoDocumentoPersonal,
                Estado = doc.Estado ?? null,
                ValorDato = doc.ValorDato ?? true,
                CodigoRequisito = doc.CodigoRequisito,
                Observacion = doc.Observacion
            }).ToList();

            var tieneDocumentosSubidos = archivosDocumentos != null && archivosDocumentos.Any();
            var postulacion = new Postulacion
            {
                IdPostulacion = data.IdPostulacion,
                IdMalla = data.IdMalla,
                IdTipoEstadoAprobacion = tieneDocumentosSubidos ? 7 : 2, // 7 = DOCUMENTOS_REVISION, 2 = ESPERA_DOCUMENTOS
                IdUsuarioEvaluador = null,
                ObservacionesRevision = tieneDocumentosSubidos 
                    ? "Postulación actualizada. Documentos cargados para revisión." 
                    : "Postulación actualizada. Pendiente de cargar documentos."
            };

            var idPersona = await _personaPostulacionRepository.ActualizarPostulacionContactoAsync(
                data.IdPersona,
                persona,
                personaInfo,
                datosContacto,
                direccion,
                actividadEconomica,
                discapacidad,
                nacionalidad,
                documentosPersonales,
                postulacion,
                archivoDiscapacidad,
                archivosDocumentos,
                documentosRequierenArchivo,
                cancellationToken);

            return Response<int>.Success(idPersona, "Postulación actualizada correctamente.");
        }
        catch (InvalidOperationException ex)
        {
            return Response<int>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error en ActualizarPostulacionContactoHandler: {ex.Message}");
            throw;
        }
    }
}
