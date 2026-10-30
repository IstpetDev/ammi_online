using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Segurity;

public class AuthRepository : IAuthRepository
{
    private readonly Ammi_OnlineContext _context;

    public AuthRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Usuario?> GetByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        return await _context.Usuario
            .Include(u => u.IdPersonaNavigation)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
    }

    public async Task<Usuario?> GetByUsernameWithRolesAsync(string username, CancellationToken cancellationToken)
    {
        var usuario = await _context.Usuario
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);

        if (usuario == null)
            return null;

        // Cargar roles en query separada para evitar problemas con Include anidados
        var rolesUsuario = await _context.RolUsuario
            .Where(ru => ru.IdPersona == usuario.IdPersona)
            .Include(ru => ru.IdRolNavigation)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        usuario.RolUsuario = rolesUsuario;

        return usuario;
    }

    public async Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken)
    {
        return await _context.Usuario
            .AnyAsync(u => u.Username == username, cancellationToken);
    }

    public async Task<Usuario> CreateUserAsync(Usuario usuario, CancellationToken cancellationToken)
    {
        await _context.Usuario.AddAsync(usuario, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return usuario;
    }

    public async Task<bool> UpdatePasswordAsync(int idPersona, string newHashedPassword, CancellationToken cancellationToken)
    {
        var usuario = await _context.Usuario.FindAsync(new object[] { idPersona }, cancellationToken);

        if (usuario == null)
            return false;

        usuario.Contrasenia = newHashedPassword;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IEnumerable<ModuloOperacion>> GetPermisosUsuarioAsync(int idPersona, CancellationToken cancellationToken)
    {
        return await _context.RolUsuario
            .Where(ru => ru.IdPersona == idPersona)
            .Join(_context.RolOperacion,
                ru => ru.IdRol,
                ro => ro.IdRol,
                (ru, ro) => ro)
            .Where(ro => ro.EsActivo)
            .Join(_context.ModuloOperacion,
                ro => ro.IdModuloOperacion,
                mo => mo.IdModuloOperacion,
                (ro, mo) => mo)
            .Where(mo => mo.EsActivo)
            .Include(mo => mo.IdModuloNavigation)
            .Include(mo => mo.IdOperacionNavigation)
            .AsNoTracking()
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<RolUsuario>> GetRolesUsuarioAsync(int idPersona, CancellationToken cancellationToken)
    {
        return await _context.RolUsuario
            .Where(ru => ru.IdPersona == idPersona)
            .Include(ru => ru.IdRolNavigation)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<string> GenerarUsernameUnicoAsync(string usernameBase, CancellationToken cancellationToken)
    {
        // Verificar si el username base está disponible
        var existe = await _context.Usuario
            .AnyAsync(u => u.Username == usernameBase, cancellationToken);

        if (!existe)
            return usernameBase;

        // Buscar todos los usernames que empiecen con el base + "x"
        var patron = usernameBase + "x";
        var usuariosExistentes = await _context.Usuario
            .Where(u => u.Username.StartsWith(patron))
            .Select(u => u.Username)
            .ToListAsync(cancellationToken);

        // Encontrar el siguiente número disponible
        int siguienteNumero = 1;
        if (usuariosExistentes.Any())
        {
            var numeros = usuariosExistentes
                .Select(u => {
                    var sufijo = u.Substring(patron.Length);
                    return int.TryParse(sufijo, out int num) ? num : 0;
                })
                .Where(n => n > 0)
                .ToList();

            if (numeros.Any())
                siguienteNumero = numeros.Max() + 1;
        }

        return $"{usernameBase}x{siguienteNumero}";
    }

    public async Task<Usuario?> GetByUsernameWithContactoAsync(string username, CancellationToken cancellationToken)
    {
        return await _context.Usuario
            .Include(u => u.IdPersonaNavigation)
                .ThenInclude(p => p.DatosContacto)
            .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
    }

    public async Task<Usuario?> GetByIdPersonaAsync(int idPersona, CancellationToken cancellationToken)
    {
        return await _context.Usuario
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.IdPersona == idPersona, cancellationToken);
    }

    public async Task<bool> SaveResetTokenAsync(int idPersona, string token, DateTime expiry, CancellationToken cancellationToken)
    {
        var usuario = await _context.Usuario.FindAsync(new object[] { idPersona }, cancellationToken);
        if (usuario == null) return false;

        usuario.ResetPasswordToken = token;
        usuario.ResetPasswordTokenExpiry = expiry;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<Usuario?> GetByResetTokenAsync(string token, CancellationToken cancellationToken)
    {
        return await _context.Usuario
            .FirstOrDefaultAsync(u => u.ResetPasswordToken == token, cancellationToken);
    }

    public async Task<bool> ClearResetTokenAsync(int idPersona, CancellationToken cancellationToken)
    {
        var usuario = await _context.Usuario.FindAsync(new object[] { idPersona }, cancellationToken);
        if (usuario == null) return false;

        usuario.ResetPasswordToken = null;
        usuario.ResetPasswordTokenExpiry = null;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SetRequiereCambioContraseniaAsync(int idPersona, bool requiere, CancellationToken cancellationToken)
    {
        var usuario = await _context.Usuario.FindAsync(new object[] { idPersona }, cancellationToken);
        if (usuario == null) return false;

        usuario.RequiereCambioContrasenia = requiere;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
