using AMMI_Online_API.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Domain.Interfaces.Postulations;

public interface IPersonaPostulacion
{
    Task<int> CrearPersonaPostulacionAsync(
        Persona persona,
        PersonaInfo personaInfo,
        List<DatosContacto> datosContacto,
        Postulacion postulacion,
        Usuario usuario,
        RolUsuario usuariorol,
        CancellationToken cancellationToken);

    Task<int> CrearPersonaPostulacionManual(
        Persona persona,
        PersonaInfo personaInfo,
        List<DatosContacto> datosContacto,
        PersonaDireccion direccion,
        PersonaActividadEconomica actividadEconomica,
        PersonaDiscapacidad discapacidad,
        PersonaNacionalidad nacionalidad,
        List<DocumentosPersonales> documentosPersonales,
        Postulacion postulacion,
        Usuario usuario,
        RolUsuario usuariorol,
        //Matricula matricula,
        //List<Credito> creditos, 
        //List<DetalleCredito> detallesCredito,
        //Pago? pagoInicial,
        IFormFile? archivoDiscapacidad,
        List<IFormFile> archivosDocumentosPersonales,
        List<bool>? documentosRequierenArchivo = null,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<Postulacion>> FindAsync(
        string? documento,
        int? idCiclo,
        int? idMalla,
        int? idOferta,
        CancellationToken cancellationToken);

    Task<IEnumerable<Postulacion>> FindPagedAsync(
        string? documento,
        int? idCiclo,
        int? idMalla,
        int? idOferta,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<int> CountAsync(
        string? documento,
        int? idCiclo,
        int? idMalla,
        int? idOferta,
        CancellationToken cancellationToken);

    Task<IEnumerable<DetalleMalla>> GetDetallesMallaByMallaIdAsync(
    int idMalla,
    CancellationToken cancellationToken);

    Task<int> ActualizarPostulacionContactoAsync(
        int idPersona,
        Persona persona,
        PersonaInfo personaInfo,
        List<DatosContacto> datosContacto,
        PersonaDireccion direccion,
        PersonaActividadEconomica? actividadEconomica,
        PersonaDiscapacidad? discapacidad,
        PersonaNacionalidad nacionalidad,
        List<DocumentosPersonales> documentosPersonales,
        Postulacion postulacion,
        IFormFile? archivoDiscapacidad,
        List<IFormFile> archivosDocumentosPersonales,
        List<bool>? documentosRequierenArchivo = null,
        CancellationToken cancellationToken = default);

    Task<bool> ExisteDocumentoAsync(string documento, CancellationToken cancellationToken);

    Task<List<string>> ObtenerContactosDuplicadosAsync(IEnumerable<string> detalles, CancellationToken cancellationToken);
}