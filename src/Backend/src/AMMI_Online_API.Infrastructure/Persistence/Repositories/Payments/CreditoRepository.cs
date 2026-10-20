using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class CreditoRepository : ICreditoRepository
{
    private readonly Ammi_OnlineContext _context;

    public CreditoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Credito>> GetCreditosByMatriculaAsync(
        int idMatricula,
        CancellationToken cancellationToken)
    {
        return await _context.Credito
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdEspecieNavigation)
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdCicloNavigation)
            .Include(c => c.DetalleCredito)
            .Where(c => c.IdMatricula == idMatricula)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Credito>> GetCreditosSimpleByMatriculaAsync(
        int idMatricula,
        CancellationToken cancellationToken)
    {
        return await _context.Credito
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdEspecieNavigation) // Incluye Especie para EsDiferible
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdCicloNavigation)
            // No Incluye DetalleCredito
            .Where(c => c.IdMatricula == idMatricula)
            .ToListAsync(cancellationToken);
    }

    public async Task<Credito?> GetCreditoByIdAsync(
        int idCredito,
        CancellationToken cancellationToken)
    {
        return await _context.Credito
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdEspecieNavigation)
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdCicloNavigation)
            .Include(c => c.DetalleCredito)
            .FirstOrDefaultAsync(c => c.IdCredito == idCredito, cancellationToken);
    }

    public async Task<bool> TieneDetallesCreditoAsync(
        int idCredito,
        CancellationToken cancellationToken)
    {
        return await _context.DetalleCredito
            .AnyAsync(dc => dc.IdCredito == idCredito, cancellationToken);
    }

    public async Task<IEnumerable<DetalleCredito>> CrearDetallesCreditoAsync(
        IEnumerable<DetalleCredito> detalles,
        CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await _context.DetalleCredito.AddRangeAsync(detalles, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return detalles;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IEnumerable<DetalleCredito>> GetDetallesCreditoByMatriculaAsync(
        int idMatricula,
        CancellationToken cancellationToken)
    {
        // Navegacion: Matrícula -> Crédito -> DetalleCredito
        // Filtramos DetalleCredito donde su Crédito asociado pertenezca a la Matrícula dada.
        return await _context.DetalleCredito
            .AsNoTracking()
            .Include(dc => dc.IdCreditoNavigation)
            .Where(dc => dc.IdCreditoNavigation.IdMatricula == idMatricula)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<DetalleCredito>> GetDetallesByCreditoAsync(
        int idCredito,
        CancellationToken cancellationToken)
    {
        return await _context.DetalleCredito
            .AsNoTracking()
            .Where(dc => dc.IdCredito == idCredito)
            .ToListAsync(cancellationToken);
    }

    public async Task ActualizarCreditoAsync(
        Credito credito,
        CancellationToken cancellationToken)
    {
        _context.Credito.Update(credito);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task EliminarDetallesPendientesAsync(
        int idCredito,
        CancellationToken cancellationToken)
    {
        var pendientes = await _context.DetalleCredito
            .Where(dc => dc.IdCredito == idCredito && !dc.Pagado)
            .ToListAsync(cancellationToken);

        if (pendientes.Any())
        {
            _context.DetalleCredito.RemoveRange(pendientes);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task UpdateCreditoAsync(Credito credito, CancellationToken cancellationToken)
    {
        var existe = await _context.Credito.AnyAsync(c => c.IdCredito == credito.IdCredito, cancellationToken);
        if (!existe)
            throw new KeyNotFoundException($"El crédito con ID {credito.IdCredito} no existe.");

        _context.Credito.Update(credito);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
