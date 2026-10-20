namespace AMMI_Online_API.Application.Services;

public interface IInfraestructuraValidationService
{
    /// <summary>
    /// Valida que las fechas del ciclo sean coherentes
    /// </summary>
    (bool EsValido, string Mensaje) ValidarFechasCiclo(
        DateOnly? fechaInicio,
        DateOnly? fechaFin);

    /// <summary>
    /// Valida que no exista otro ciclo activo en el mismo periodo/regimen
    /// </summary>
    Task<(bool EsValido, string Mensaje)> ValidarCicloActivoUnicoAsync(
        int idPeriodo,
        int idRegimen,
        int? idCicloExcluir,
        CancellationToken cancellationToken);

    /// <summary>
    /// Valida que la materia no este duplicada en la malla
    /// </summary>
    Task<(bool EsValido, string Mensaje)> ValidarMateriaUnicaEnMallaAsync(
        int idMalla,
        int idMateria,
        int? idDetalleMallaExcluir,
        CancellationToken cancellationToken);

    /// <summary>
    /// Valida que se pueda eliminar una plantilla (no en uso)
    /// </summary>
    Task<(bool EsValido, string Mensaje)> ValidarPlantillaEliminableAsync(
        int idPlantillaEvaluacion,
        CancellationToken cancellationToken);

    /// <summary>
    /// Valida que se pueda eliminar una malla (sin matriculas)
    /// </summary>
    Task<(bool EsValido, string Mensaje)> ValidarMallaEliminableAsync(
        int idMalla,
        CancellationToken cancellationToken);
}
