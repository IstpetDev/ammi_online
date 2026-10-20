using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class SaldoFavorRepository : ISaldoFavorRepository
{
    private readonly Ammi_OnlineContext _context;

    public SaldoFavorRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<SaldoFavorAlumno> GetOrCreateByPersonaAsync(int idPersona, CancellationToken cancellationToken)
    {
        var saldoFavor = await _context.SaldoFavorAlumno
            .FirstOrDefaultAsync(s => s.IdPersona == idPersona, cancellationToken);

        if (saldoFavor == null)
        {
            saldoFavor = new SaldoFavorAlumno
            {
                IdPersona = idPersona,
                Saldo = 0,
                UpdatedAt = DateTime.Now
            };
            _context.SaldoFavorAlumno.Add(saldoFavor);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return saldoFavor;
    }

    public async Task AplicarSaldoAsync(int idPersona, int idDetalleCredito, decimal monto, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // 1. Obtener SaldoFavorAlumno del alumno (lanzar si no existe)
            var saldoFavor = await _context.SaldoFavorAlumno
                .FirstOrDefaultAsync(s => s.IdPersona == idPersona, cancellationToken);

            // 2. Obtener DetalleCredito con su Credito
            var detalleCredito = await _context.DetalleCredito
                .Include(d => d.IdCreditoNavigation)
                .FirstOrDefaultAsync(d => d.IdDetalleCredito == idDetalleCredito, cancellationToken);

            if (detalleCredito == null)
            {
                throw new Exception($"El detalle de crédito con ID {idDetalleCredito} no existe.");
            }

            // 4. Validar: SaldoFavorAlumno.Saldo >= monto (ya hecho arriba parcialmente, pero validamos de nuevo con el monto exacto)
            if ((saldoFavor.Saldo ?? 0) < monto)
            {
                throw new Exception("Saldo insuficiente.");
            }

            // 5. Validar: DetalleCredito.SaldoCuota >= monto
            if (detalleCredito.SaldoCuota < monto)
            {
                throw new Exception($"El monto a aplicar ({monto}) supera el saldo de la cuota ({detalleCredito.SaldoCuota}).");
            }

            // 6. Actualizar SaldoFavorAlumno
            saldoFavor.Saldo = (saldoFavor.Saldo ?? 0) - monto;
            saldoFavor.UpdatedAt = DateTime.Now;
            _context.SaldoFavorAlumno.Update(saldoFavor);

            // 7. Actualizar DetalleCredito
            detalleCredito.SaldoCuota -= monto;
            if (detalleCredito.SaldoCuota <= 0)
            {
                detalleCredito.Pagado = true;
                detalleCredito.Estado = "PAGADO";
            }
            _context.DetalleCredito.Update(detalleCredito);

            // 9. Actualizar IdCreditoNavigation.SaldoPendiente
            var credito = detalleCredito.IdCreditoNavigation;
            credito.SaldoPendiente -= monto;
            if (credito.SaldoPendiente <= 0)
            {
                credito.SaldoPendiente = 0;
                credito.Estado = "PAGADO";
            }
            credito.UpdatedAt = DateTime.Now;
            _context.Credito.Update(credito);

            // 11. Crear SaldoFavorMovimiento
            var movimiento = new SaldoFavorMovimiento
            {
                IdSaldoFavor = saldoFavor.IdSaldoFavor,
                Monto = -monto, // negativo = consumo
                Concepto = $"Aplicado a cuota #{detalleCredito.NumeroCuota} - Crédito #{detalleCredito.IdCredito}",
                IdCredito = detalleCredito.IdCredito,
                IdDetalleCredito = idDetalleCredito,
                FechaMovimiento = DateTime.Now
            };
            _context.SaldoFavorMovimiento.Add(movimiento);

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IEnumerable<SaldoFavorMovimiento>> GetMovimientosAsync(int idPersona, int limit, CancellationToken cancellationToken)
    {
        var saldoFavor = await _context.SaldoFavorAlumno
            .FirstOrDefaultAsync(s => s.IdPersona == idPersona, cancellationToken);

        if (saldoFavor == null)
        {
            return new List<SaldoFavorMovimiento>();
        }

        return await _context.SaldoFavorMovimiento
            .Where(m => m.IdSaldoFavor == saldoFavor.IdSaldoFavor)
            .OrderByDescending(m => m.FechaMovimiento)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task AgregarSaldoAsync(int idPersona, decimal monto, string concepto, int? idCredito, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // 1. GetOrCreate del SaldoFavorAlumno
            var saldoFavor = await GetOrCreateByPersonaAsync(idPersona, cancellationToken);

            // 2. SaldoFavorAlumno.Saldo += monto
            saldoFavor.Saldo = (saldoFavor.Saldo ?? 0) + monto;
            saldoFavor.UpdatedAt = DateTime.Now;
            _context.SaldoFavorAlumno.Update(saldoFavor);

            // 4. Crear SaldoFavorMovimiento:
            var movimiento = new SaldoFavorMovimiento
            {
                IdSaldoFavor = saldoFavor.IdSaldoFavor,
                Monto = monto, // positivo = ingreso
                Concepto = concepto,
                IdCredito = idCredito,
                FechaMovimiento = DateTime.Now
            };
            _context.SaldoFavorMovimiento.Add(movimiento);

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
