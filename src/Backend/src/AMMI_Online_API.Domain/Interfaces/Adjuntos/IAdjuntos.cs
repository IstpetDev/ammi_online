using AMMI_Online_API.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Domain.Interfaces.Adjuntos;
public interface IAdjuntos
{
    Task<Adjunto?> GuardarArchivoAsync(IFormFile archivo, string subcarpeta, CancellationToken cancellationToken);
    Task<byte[]> DescargarArchivoAsync(int idAdjunto, CancellationToken cancellationToken);
    Task<Adjunto?> GetByIdAsync(int id, CancellationToken ct);
    Task<bool> EliminarArchivoAsync(int idAdjunto, CancellationToken cancellationToken);
}
