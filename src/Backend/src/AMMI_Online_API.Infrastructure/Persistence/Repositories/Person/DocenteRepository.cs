using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;

public class DocenteRepository : IDocenteRepository
{
    private readonly Ammi_OnlineContext _context;

    public DocenteRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<bool> ExisteDocumentoAsync(string documento, CancellationToken cancellationToken)
    {
        return await _context.Persona
            .AnyAsync(p => p.Documento == documento, cancellationToken);
    }

    public async Task<int> CrearDocenteAsync(
        Persona persona,
        DatosContacto datosContacto,
        Usuario usuario,
        RolUsuario rolUsuario,
        CancellationToken cancellationToken)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        // 1. Crear Persona
        await _context.Persona.AddAsync(persona, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 2. Crear DatosContacto
        datosContacto.IdPersona = persona.IdPersona;
        await _context.DatosContacto.AddAsync(datosContacto, cancellationToken);

        // 3. Crear Usuario
        usuario.IdPersona = persona.IdPersona;
        await _context.Usuario.AddAsync(usuario, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        // 4. Crear RolUsuario
        rolUsuario.IdPersona = persona.IdPersona;
        await _context.RolUsuario.AddAsync(rolUsuario, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return persona.IdPersona;
    }
}
