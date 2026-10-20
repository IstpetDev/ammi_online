using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface IInstitucion
    {
        Task<IEnumerable<Institucion>> FindAsync(
            int? idInstitucion,
            string? detalle,
            string? representanteLegal,
            string? ruc,
            int? idAdjunto,
            CancellationToken cancellationToken);
        Task<Institucion?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<Institucion> AddAsync(Institucion institucion, CancellationToken cancellationToken);
        Task<Institucion> UpdateAsync(Institucion institucion, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
