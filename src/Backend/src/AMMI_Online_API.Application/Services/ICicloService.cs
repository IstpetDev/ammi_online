using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Application.Services;

public interface ICicloService
{
    Task<Ciclo?> ObtenerCicloActivoVigenteAsync(CancellationToken cancellationToken = default);
    Task<Ciclo?> ObtenerCicloPorMallaAsync(int idMalla, CancellationToken cancellationToken = default);
    Task<Especie?> ObtenerPrimeraEspecieMatriculaAsync(CancellationToken cancellationToken = default);
    Task<Especie?> ObtenerPrimeraEspeciePensionAsync(CancellationToken cancellationToken = default);
    Task<List<Especie>> ObtenerEspeciesPensionAsync(CancellationToken cancellationToken = default);
    Task<EspecieCiclo?> ObtenerEspecieCicloAsync(int idMalla, int idEspecie, CancellationToken cancellationToken = default);
    Task<List<EspecieCiclo>> ObtenerTodasEspeciesMallaAsync(int idMalla, CancellationToken cancellationToken = default);
    Task<(Especie? Especie, EspecieCiclo? EspecieCiclo)?> ObtenerPrimeraEspecieCicloMatriculaAsync(
         int idMalla, CancellationToken cancellationToken = default);
}
