using AMMI_Online_API.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Domain.Interfaces.Person;

public interface IFotoPerfilRepository
{
    Task<DocumentosPersonales?> GetByDocumentoAsync(string documento, CancellationToken cancellationToken);
    Task<DocumentosPersonales?> GetByPersonaIdAsync(int idPersona, CancellationToken cancellationToken);
    Task<DocumentosPersonales> UpdateFotoAsync(int idDocumentosPersonales, IFormFile archivo, CancellationToken cancellationToken);
    Task<bool> DeleteFotoAsync(int idDocumentosPersonales, CancellationToken cancellationToken);
    Task<bool> DeleteFotoAdminByDocumentoAsync(string documento, CancellationToken cancellationToken);
    Task<bool> DeleteFotoAdminByPersonaIdAsync(int idPersona, CancellationToken cancellationToken);
}
