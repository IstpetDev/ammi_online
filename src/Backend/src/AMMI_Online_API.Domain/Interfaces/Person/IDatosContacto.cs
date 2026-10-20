using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Person
{
    public interface IDatosContacto
    {
        Task<IEnumerable<DatosContacto>> FindAsync(
            int? idDatosContacto,
            int? idTipoDatoContacto,
            int? idPersona,
            string? detalle,
            bool? esPrincipal,
            CancellationToken cancellationToken);
        Task<DatosContacto> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<DatosContacto> AddAsync(DatosContacto datosContacto, CancellationToken cancellationToken);
        Task<DatosContacto> UpdateAsync(DatosContacto datosContacto, CancellationToken cancellationToken);
        Task<DatosContacto> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
