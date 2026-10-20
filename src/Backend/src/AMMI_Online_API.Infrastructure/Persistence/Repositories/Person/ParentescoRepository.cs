using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;

public class ParentescoRepository : IParentesco
{
    private readonly Ammi_OnlineContext _context;
    public ParentescoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }
    public async Task<IEnumerable<Parentesco>> FindAsync(
        int? idParentesco,
        int? idPersonaOrigen,
        int? idPersonaDestino,
        int? idTipoParentesco,
        bool? representante,
        bool? tutor,
        bool? responsableFinciero,
        bool? conviveAlumno,
        CancellationToken cancellationToken)
    {
        IQueryable<Parentesco> query = _context.Parentesco.AsNoTracking();
        if (idParentesco.HasValue)
            query = query.Where(p => p.IdParentesco == idParentesco.Value);
        if (idPersonaOrigen.HasValue)
            query = query.Where(p => p.IdPersonaOrigen == idPersonaOrigen.Value);
        if (idPersonaDestino.HasValue)
            query = query.Where(p => p.IdPersonaDestino == idPersonaDestino.Value);
        if (idTipoParentesco.HasValue)
            query = query.Where(p => p.IdTipoParentesco == idTipoParentesco.Value);
        if (representante.HasValue)
            query = query.Where(p => p.Representante == representante.Value);
        if (tutor.HasValue)
            query = query.Where(p => p.Tutor == tutor.Value);
        if (responsableFinciero.HasValue)
            query = query.Where(p => p.ResponsableFinciero == responsableFinciero.Value);
        if (conviveAlumno.HasValue)
            query = query.Where(p => p.ConviveAlumno == conviveAlumno.Value);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Parentesco> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var parentesco = await _context.Parentesco
            .FirstOrDefaultAsync(p => p.IdParentesco == id, cancellationToken);
        if (parentesco == null)
            throw new KeyNotFoundException("Parentesco no encontrado.");
        return parentesco;
    }
    public async Task<Parentesco> AddAsync(Parentesco parentesco, CancellationToken cancellationToken)
    {
        await _context.Parentesco.AddAsync(parentesco, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return parentesco;
    }
    public async Task<Parentesco> UpdateAsync(Parentesco parentesco, CancellationToken cancellationToken)
    {
        var existingParentesco = await _context.Parentesco
            .FirstOrDefaultAsync(p => p.IdParentesco == parentesco.IdParentesco, cancellationToken);
        if (existingParentesco == null)
            throw new KeyNotFoundException("Parentesco no encontrado.");
        _context.Parentesco.Update(parentesco);
        await _context.SaveChangesAsync(cancellationToken);
        return existingParentesco;
    }

    public async Task<Parentesco> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var parentesco = await _context.Parentesco
            .FirstOrDefaultAsync(p => p.IdParentesco == id, cancellationToken);
        if (parentesco == null)
            throw new KeyNotFoundException("Parentesco no encontrado.");
        _context.Parentesco.Remove(parentesco);
        await _context.SaveChangesAsync(cancellationToken);
        return parentesco;
    }
    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Parentesco
            .AnyAsync(p => p.IdParentesco == id, cancellationToken);
    }
}
