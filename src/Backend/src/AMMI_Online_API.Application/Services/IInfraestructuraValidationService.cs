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

    /// <summary>
    /// Valida que la malla esté completamente configurada para permitir matrícula:
    /// ciclo activo, al menos 1 DetalleMalla, al menos 1 MallaRequisitos y al menos 1 paralelo activo.
    /// </summary>
    Task<(bool EsValido, string Mensaje)> ValidarMallaListaParaMatricularAsync(
        int idMalla,
        CancellationToken cancellationToken);

    /// <summary>
    /// Devuelve error si la malla ya tiene alumnos matriculados, bloqueando cualquier modificación estructural.
    /// </summary>
    Task<(bool EsValido, string Mensaje)> ValidarMallaSinMatriculadosAsync(
        int idMalla,
        CancellationToken cancellationToken);

    /// <summary>
    /// Devuelve error si alguna malla del ciclo ya tiene alumnos matriculados,
    /// bloqueando modificaciones en EspecieCiclo.
    /// </summary>
    Task<(bool EsValido, string Mensaje)> ValidarCicloSinMatriculadosAsync(
        int idCiclo,
        CancellationToken cancellationToken);

    /// <summary>
    /// Devuelve error si la malla del EspecieCiclo pertenece a un ciclo con alumnos matriculados.
    /// Navega desde la malla para obtener el ciclo y delega en ValidarCicloSinMatriculadosAsync.
    /// </summary>
    Task<(bool EsValido, string Mensaje)> ValidarModificacionEspecieCicloAsync(
        int idMalla,
        CancellationToken cancellationToken);
}
