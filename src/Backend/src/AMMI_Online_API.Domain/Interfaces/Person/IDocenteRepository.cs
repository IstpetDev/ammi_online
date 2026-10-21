using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Person;

public interface IDocenteRepository
{
    Task<bool> ExisteDocumentoAsync(string documento, CancellationToken cancellationToken);

    Task<int> CrearDocenteAsync(
        Persona persona,
        DatosContacto datosContacto,
        Usuario usuario,
        RolUsuario rolUsuario,
        CancellationToken cancellationToken);
}
