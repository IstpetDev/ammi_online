using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;

public class DatosContactoRepository : IDatosContacto
{
    private readonly Ammi_OnlineContext _context;
    public DatosContactoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<DatosContacto>> FindAsync(
        int? idDatosContacto,
        int? idPersona,
        int? idTipoDatoContacto,
        string? detalle,
        bool? esPrincipal,
        CancellationToken cancellationToken)
    {
        IQueryable<DatosContacto> query =
            _context.DatosContacto.AsNoTracking();
        if (idDatosContacto.HasValue)
            query = query.Where(x => x.IdDatosContacto == idDatosContacto.Value);
        if (idPersona.HasValue)
            query = query.Where(x => x.IdPersona == idPersona.Value);
        if (idTipoDatoContacto.HasValue)
            query = query.Where(x => x.IdTipoDatoContacto == idTipoDatoContacto.Value);
        if (!string.IsNullOrEmpty(detalle))
            query = query.Where(x => x.Detalle == detalle);
        if (esPrincipal.HasValue)
            query = query.Where(x => x.EsPrincipal == esPrincipal.Value);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<DatosContacto> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var datosContacto = await _context.DatosContacto
            .FirstOrDefaultAsync(
                x => x.IdDatosContacto == id, cancellationToken);
        if (datosContacto == null)
            throw new KeyNotFoundException("Dato de contacto no encontrado.");
        return datosContacto;
    }
    public async Task<DatosContacto> AddAsync(DatosContacto datosContacto, CancellationToken cancellationToken)
    {
        if (datosContacto.EsPrincipal)
        {
            var existingPrincipal = await _context.DatosContacto
                .FirstOrDefaultAsync(x => x.IdPersona == datosContacto.IdPersona 
                    && x.EsPrincipal, cancellationToken);
            if (existingPrincipal != null)
                throw new InvalidOperationException("La persona ya tiene un dato de contacto principal asignado.");
        }
        await _context.DatosContacto.AddAsync(datosContacto, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return datosContacto;
    }
    public async Task<DatosContacto> UpdateAsync(DatosContacto datosContacto, CancellationToken cancellationToken)
    {
        if (datosContacto.EsPrincipal)
        {
            var existingPrincipal = await _context.DatosContacto
                .FirstOrDefaultAsync(x => x.IdPersona == datosContacto.IdPersona 
                    && x.EsPrincipal 
                    && x.IdDatosContacto != datosContacto.IdDatosContacto, cancellationToken);
            if (existingPrincipal != null)
                throw new InvalidOperationException("La persona ya tiene un dato de contacto principal asignado.");
        }
        _context.DatosContacto.Update(datosContacto);
        await _context.SaveChangesAsync(cancellationToken);
        return datosContacto;
    }
    public async Task<DatosContacto> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var datosContacto = await _context.DatosContacto
            .FirstOrDefaultAsync(x => x.IdDatosContacto == id, cancellationToken);
        if (datosContacto == null)
            throw new KeyNotFoundException("Dato de contacto no encontrado.");
        _context.DatosContacto.Remove(datosContacto);
        await _context.SaveChangesAsync(cancellationToken);
        return datosContacto;
    }
    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.DatosContacto
            .AnyAsync(x => x.IdDatosContacto == id, cancellationToken);
    }
}
