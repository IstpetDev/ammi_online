using AMMI_Online_API.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Domain.Interfaces.Person;

public interface IDocumentosPersonales
{
    Task<IEnumerable<DocumentosPersonales>> FindAsync(
        int? idDocumentosPersonales = null,
        int? idPersona = null,
        int? idTipoDocumentoPersonal = null,
        int? idAdjunto = null,
        string? codigoRequisito = null,
        bool? estado = null,
        bool? valorDato = null,
        string? observacion = null,
        CancellationToken cancellationToken = default);

    Task<DocumentosPersonales> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<DocumentosPersonales> AddAsync(DocumentosPersonales documentosPersonales, CancellationToken cancellationToken);
    Task<DocumentosPersonales> AddWithFileAsync(DocumentosPersonales documentosPersonales, IFormFile? archivo, CancellationToken cancellationToken);
    Task<DocumentosPersonales> UpdateAsync(DocumentosPersonales documentosPersonales, CancellationToken cancellationToken);
    Task<DocumentosPersonales> UpdateWithFileAsync(int id, DocumentosPersonales documentosPersonales, IFormFile? archivo, CancellationToken cancellationToken);
    Task<DocumentosPersonales> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<DocumentosPersonales> DeleteWithFileAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}