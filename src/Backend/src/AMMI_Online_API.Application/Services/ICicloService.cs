using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Application.Services;

public interface ICicloService
{
    Task<Ciclo?> ObtenerCicloActivoVigenteAsync(CancellationToken cancellationToken = default);
    Task<Ciclo?> ObtenerCicloPorMallaAsync(int idMalla, CancellationToken cancellationToken = default);
    Task<Especie?> ObtenerPrimeraEspecieNoDiferibleAsync(CancellationToken cancellationToken = default);
    Task<Especie?> ObtenerPrimeraEspecieDiferibleAsync(CancellationToken cancellationToken = default); // NUEVO
    Task<List<Especie>> ObtenerEspeciesDiferiblesAsync(CancellationToken cancellationToken = default); // NUEVO
    Task<EspecieCiclo?> ObtenerEspecieCicloAsync(int idCiclo, int idEspecie, CancellationToken cancellationToken = default);
    Task<List<EspecieCiclo>> ObtenerTodasEspeciesCicloAsync(int idCiclo, CancellationToken cancellationToken = default); // NUEVO
    Task<(Especie? Especie, EspecieCiclo? EspecieCiclo)?> ObtenerPrimeraEspecieCicloNoDiferibleAsync(
         CancellationToken cancellationToken = default);
}