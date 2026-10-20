using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Application.Services;

public interface IPlantillaEstructuraService
{
    /// <summary>
    /// Obtiene la estructura completa como arbol
    /// </summary>
    Task<List<PlantillaEstructuraDTO>> GetEstructuraArbolAsync(
        int idPlantillaEvaluacion,
        CancellationToken cancellationToken);

    /// <summary>
    /// Valida que los pesos de los nodos hijos sumen 100%
    /// </summary>
    Task<ValidacionPesosDTO> ValidarPesosAsync(
        int idPlantillaEvaluacion,
        CancellationToken cancellationToken);

    /// <summary>
    /// Duplica una plantilla con toda su estructura
    /// </summary>
    Task<PlantillaEvaluacion> DuplicarPlantillaAsync(
        int idPlantillaOriginal,
        string nuevoNombre,
        CancellationToken cancellationToken);

    /// <summary>
    /// Crea estructura completa desde DTO anidado
    /// </summary>
    Task<bool> CrearEstructuraCompletaAsync(
        CrearEstructuraCompletaDTO dto,
        CancellationToken cancellationToken);

    /// <summary>
    /// Reordena nodos hermanos
    /// </summary>
    Task<bool> ReordenarNodosAsync(
        List<int> idsOrdenados,
        CancellationToken cancellationToken);
}
