using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Infrastructure;

public interface IMallaRequisitosRepository
{
    /// <summary>
    /// Obtiene una relacion por su ID
    /// </summary>
    Task<MallaRequisitos?> GetByIdAsync(int id, CancellationToken cancellationToken);

    /// <summary>
    /// Obtiene todos los requisitos de una malla
    /// </summary>
    Task<IEnumerable<MallaRequisitos>> GetByMallaIdAsync(int idMalla, CancellationToken cancellationToken);

    /// <summary>
    /// Obtiene todas las mallas que tienen un requisito especifico
    /// </summary>
    Task<IEnumerable<MallaRequisitos>> GetByRequisitoIdAsync(int idRequisito, CancellationToken cancellationToken);

    /// <summary>
    /// Agrega una nueva relacion Malla-Requisito
    /// </summary>
    Task<MallaRequisitos> AddAsync(MallaRequisitos mallaRequisitos, CancellationToken cancellationToken);

    /// <summary>
    /// Agrega multiples relaciones Malla-Requisito
    /// </summary>
    Task<IEnumerable<MallaRequisitos>> AddRangeAsync(IEnumerable<MallaRequisitos> mallaRequisitos, CancellationToken cancellationToken);

    /// <summary>
    /// Elimina una relacion por su ID
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);

    /// <summary>
    /// Elimina todas las relaciones de una malla
    /// </summary>
    Task<bool> DeleteByMallaIdAsync(int idMalla, CancellationToken cancellationToken);

    /// <summary>
    /// Verifica si existe una relacion especifica
    /// </summary>
    Task<bool> ExistsAsync(int idMalla, int idRequisito, CancellationToken cancellationToken);

    /// <summary>
    /// Obtiene todas las relaciones
    /// </summary>
    Task<IEnumerable<MallaRequisitos>> GetAllAsync(CancellationToken cancellationToken);
}
