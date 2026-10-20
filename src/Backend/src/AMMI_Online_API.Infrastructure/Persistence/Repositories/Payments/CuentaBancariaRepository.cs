using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class CuentaBancariaRepository : ICuentaBancariaRepository
{
    private readonly Ammi_OnlineContext _context;

    public CuentaBancariaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<CuentaBancaria?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.CuentaBancaria.AsNoTracking()
                .FirstOrDefaultAsync(x => x.IdCuentaBancaria == id, cancellationToken);
    }
    public async Task<IEnumerable<CuentaBancaria>> GetAllAsync(
    int? idCuentaBancaria,
    int? idTipoCuenta,
    string? numeroCuenta,
    string? banco,
    bool? activo,
    CancellationToken cancellationToken)
    {
        var query = _context.CuentaBancaria.AsNoTracking().AsQueryable();

        if (idCuentaBancaria.HasValue)
            query = query.Where(x => x.IdCuentaBancaria == idCuentaBancaria.Value);

        if (idTipoCuenta.HasValue)
            query = query.Where(x => x.IdTipoCuenta == idTipoCuenta.Value);

        if (!string.IsNullOrEmpty(numeroCuenta))
            query = query.Where(x => x.NumeroCuenta == numeroCuenta);

        if (!string.IsNullOrEmpty(banco))
            query = query.Where(x => x.Banco == banco);

        if (activo.HasValue)
            query = query.Where(x => x.Activo == activo.Value);

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<CuentaBancaria> AddAsync(CuentaBancaria cuenta, CancellationToken cancellationToken)
    {
        await _context.CuentaBancaria.AddAsync(cuenta, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return cuenta;
    }

    public async Task<CuentaBancaria> UpdateAsync(CuentaBancaria cuenta, CancellationToken cancellationToken)
    {
        _context.CuentaBancaria.Update(cuenta);
        await _context.SaveChangesAsync(cancellationToken);
        return cuenta;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.CuentaBancaria.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null)
            return false;
        entity.Activo = false; // Soft delete
        _context.CuentaBancaria.Update(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.CuentaBancaria
            .AnyAsync(x => x.IdCuentaBancaria == id, cancellationToken);
    }


}
