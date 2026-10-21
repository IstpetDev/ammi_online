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
        var creditos = await _context.Credito
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdEspecieNavigation)
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdMallaNavigation)
                    .ThenInclude(m => m.IdCicloNavigation)
            .Include(c => c.DetalleCredito)
                .ThenInclude(dc => dc.PagoCuota)
                    .ThenInclude(pc => pc.IdPagoNavigation)
            .Where(c => c.IdMatricula == idMatricula)
            .ToListAsync(cancellationToken);

        bool databaseChanged = false;

        foreach (var credito in creditos)
        {
            var esMatricula = credito.IdEspecieCicloNavigation?.IdEspecieNavigation?.EsMatricula ?? false;
            if (esMatricula && credito.DetalleCredito.Count > 1)
            {
                var cuotaPagada = credito.DetalleCredito.FirstOrDefault(d => d.Pagado || d.SaldoCuota == 0);
                if (cuotaPagada != null)
                {
                    var cuotasExtra = credito.DetalleCredito
                        .Where(d => d.IdDetalleCredito != cuotaPagada.IdDetalleCredito && 
                                    (!d.PagoCuota.Any(pc => pc.IdPagoNavigation.IdEstadoPago != 3 && pc.IdPagoNavigation.IdEstadoPago != 4)))
                        .ToList();

                    if (cuotasExtra.Any())
                    {
                        _context.DetalleCredito.RemoveRange(cuotasExtra);
                        foreach (var extra in cuotasExtra)
                        {
                            credito.DetalleCredito.Remove(extra);
                        }

                        credito.SaldoPendiente = 0;
                        credito.Estado = "CANCELADO";
                        _context.Credito.Update(credito);
                        databaseChanged = true;
                    }
                }
            }
        }

        if (databaseChanged)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return creditos;
    }

    public async Task<IEnumerable<Credito>> GetCreditosSimpleByMatriculaAsync(
        int idMatricula,
        CancellationToken cancellationToken)
    {
        return await _context.Credito
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdEspecieNavigation)
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdMallaNavigation)
                    .ThenInclude(m => m.IdCicloNavigation)
            // No Incluye DetalleCredito
            .Where(c => c.IdMatricula == idMatricula)
            .ToListAsync(cancellationToken);
    }

    public async Task<Credito?> GetCreditoByIdAsync(
        int idCredito,
        CancellationToken cancellationToken)
    {
        return await _context.Credito
            .Include(c => c.IdMatriculaNavigation)
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdEspecieNavigation)
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdMallaNavigation)
                    .ThenInclude(m => m.IdCicloNavigation)
                        .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(c => c.DetalleCredito)
                .ThenInclude(dc => dc.PagoCuota)
                    .ThenInclude(pc => pc.IdPagoNavigation)
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
            .Include(dc => dc.PagoCuota)
                .ThenInclude(pc => pc.IdPagoNavigation)
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

    public async Task<DetalleCredito?> GetDetalleCreditoByIdAsync(int idDetalleCredito, CancellationToken cancellationToken)
    {
        return await _context.DetalleCredito
            .AsNoTracking()
            .FirstOrDefaultAsync(dc => dc.IdDetalleCredito == idDetalleCredito, cancellationToken);
    }

    public async Task ActualizarFechaLimiteCuotaAsync(int idDetalleCredito, DateOnly nuevaFechaLimite, CancellationToken cancellationToken)
    {
        var cuota = await _context.DetalleCredito
            .FindAsync(new object[] { idDetalleCredito }, cancellationToken);

        if (cuota == null) return;

        cuota.FechaLimite = nuevaFechaLimite;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateDetallesCreditoAsync(IEnumerable<DetalleCredito> detalles, CancellationToken cancellationToken = default)
    {
        _context.DetalleCredito.UpdateRange(detalles);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Credito> AsignarCreditoExtraAsync(int idMatricula, int idEspecie, decimal monto, DateOnly? fechaLimite, string? observaciones, CancellationToken cancellationToken)
    {
        var matricula = await _context.Matricula
            .Include(m => m.IdMallaParaleloNavigation)
            .FirstOrDefaultAsync(m => m.IdMatricula == idMatricula, cancellationToken);

        if (matricula == null)
            throw new KeyNotFoundException($"No se encontró la matrícula con ID {idMatricula}.");

        var idMalla = matricula.IdMallaParaleloNavigation.IdMalla;

        var especieCiclo = await _context.EspecieCiclo
            .FirstOrDefaultAsync(ec => ec.IdMalla == idMalla && ec.IdEspecie == idEspecie, cancellationToken);

        if (especieCiclo == null)
        {
            especieCiclo = new EspecieCiclo
            {
                IdMalla = idMalla,
                IdEspecie = idEspecie,
                ValorEspecie = monto
            };
            await _context.EspecieCiclo.AddAsync(especieCiclo, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var credito = new Credito
        {
            IdMatricula = idMatricula,
            IdEspecieCiclo = especieCiclo.IdEspecieCiclo,
            MontoOriginal = monto,
            MontoBeneficio = 0,
            MontoFinal = monto,
            SaldoPendiente = monto,
            Estado = "ACTIVO",
            FechaGeneracion = DateOnly.FromDateTime(DateTime.Now),
            CreatedAt = DateTime.UtcNow
        };
        await _context.Credito.AddAsync(credito, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var detalleCredito = new DetalleCredito
        {
            IdCredito = credito.IdCredito,
            NumeroCuota = 1,
            ValorOriginal = monto,
            SaldoCuota = monto,
            FechaLimite = fechaLimite,
            Estado = "PENDIENTE",
            Pagado = false
        };
        await _context.DetalleCredito.AddAsync(detalleCredito, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return credito;
    }

    public async Task<(int TotalEvaluadas, int TotalAsignados, int TotalOmitidosDuplicados)> AsignarCreditoExtraMasivoAsync(
        List<int> idsMallas, 
        int idEspecie, 
        decimal monto, 
        DateOnly? fechaLimite, 
        string? observaciones, 
        CancellationToken cancellationToken)
    {
        if (idsMallas == null || !idsMallas.Any())
            return (0, 0, 0);

        var matriculas = await _context.Matricula
            .Include(m => m.IdMallaParaleloNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
            .Where(m => m.IdMallaParaleloNavigation != null && idsMallas.Contains(m.IdMallaParaleloNavigation.IdMalla))
            .ToListAsync(cancellationToken);

        int totalEvaluadas = matriculas.Count;
        int totalAsignados = 0;
        int totalOmitidos = 0;

        if (totalEvaluadas == 0)
            return (0, 0, 0);

        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var especiesCicloDict = new Dictionary<int, EspecieCiclo>();
            var distinctMallas = matriculas.Select(m => m.IdMallaParaleloNavigation.IdMalla).Distinct().ToList();

            foreach (var idMalla in distinctMallas)
            {
                var especieCiclo = await _context.EspecieCiclo
                    .FirstOrDefaultAsync(ec => ec.IdMalla == idMalla && ec.IdEspecie == idEspecie, cancellationToken);

                if (especieCiclo == null)
                {
                    especieCiclo = new EspecieCiclo
                    {
                        IdMalla = idMalla,
                        IdEspecie = idEspecie,
                        ValorEspecie = monto
                    };
                    await _context.EspecieCiclo.AddAsync(especieCiclo, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);
                }

                especiesCicloDict[idMalla] = especieCiclo;
            }

            var fechaHoy = DateOnly.FromDateTime(DateTime.Now);
            var nowUtc = DateTime.UtcNow;

            foreach (var mat in matriculas)
            {
                bool yaExiste = mat.Credito != null && mat.Credito.Any(c => 
                    c.IdEspecieCicloNavigation != null && 
                    c.IdEspecieCicloNavigation.IdEspecie == idEspecie &&
                    c.Estado != "CANCELADO"
                );

                if (yaExiste)
                {
                    totalOmitidos++;
                    continue;
                }

                var idMalla = mat.IdMallaParaleloNavigation.IdMalla;
                if (!especiesCicloDict.TryGetValue(idMalla, out var eciclo))
                    continue;

                var credito = new Credito
                {
                    IdMatricula = mat.IdMatricula,
                    IdEspecieCiclo = eciclo.IdEspecieCiclo,
                    MontoOriginal = monto,
                    MontoBeneficio = 0,
                    MontoFinal = monto,
                    SaldoPendiente = monto,
                    Estado = "ACTIVO",
                    FechaGeneracion = fechaHoy,
                    CreatedAt = nowUtc
                };
                
                await _context.Credito.AddAsync(credito, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                var detalleCredito = new DetalleCredito
                {
                    IdCredito = credito.IdCredito,
                    NumeroCuota = 1,
                    ValorOriginal = monto,
                    SaldoCuota = monto,
                    FechaLimite = fechaLimite,
                    Estado = "PENDIENTE",
                    Pagado = false
                };
                await _context.DetalleCredito.AddAsync(detalleCredito, cancellationToken);

                totalAsignados++;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return (totalEvaluadas, totalAsignados, totalOmitidos);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<bool> AnularCreditoExtraAsync(int idCredito, CancellationToken cancellationToken)
    {
        var credito = await _context.Credito
            .Include(c => c.DetalleCredito)
                .ThenInclude(dc => dc.PagoCuota)
                    .ThenInclude(pc => pc.IdPagoNavigation)
            .FirstOrDefaultAsync(c => c.IdCredito == idCredito, cancellationToken);

        if (credito == null)
            throw new KeyNotFoundException($"No se encontró el crédito con ID {idCredito}.");

        var tienePagos = credito.DetalleCredito.Any(dc => 
            (dc.ValorOriginal > dc.SaldoCuota) || 
            dc.PagoCuota.Any(pc => pc.IdPagoNavigation != null && pc.IdPagoNavigation.FechaEliminacion == null && pc.IdPagoNavigation.IdEstadoPago != 3 && pc.IdPagoNavigation.IdEstadoPago != 4)
        );

        if (tienePagos)
            throw new InvalidOperationException("No se puede anular un costo extra que ya registra pagos o abonos asociados.");

        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var detalleIds = credito.DetalleCredito.Select(d => d.IdDetalleCredito).ToList();

            if (detalleIds.Any())
            {
                var detalleIdsStr = string.Join(",", detalleIds);
                await _context.Database.ExecuteSqlRawAsync($"DELETE FROM saldo_favor_movimiento WHERE id_credito = {idCredito} OR id_detalle_credito IN ({detalleIdsStr});", cancellationToken);
                await _context.Database.ExecuteSqlRawAsync($"DELETE FROM pago_cuota WHERE id_detalle_credito IN ({detalleIdsStr});", cancellationToken);
            }
            else
            {
                await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM saldo_favor_movimiento WHERE id_credito = {idCredito};", cancellationToken);
            }

            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM credito_beneficio WHERE id_credito = {idCredito};", cancellationToken);
            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM detalle_credito WHERE id_credito = {idCredito};", cancellationToken);
            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM credito WHERE id_credito = {idCredito};", cancellationToken);

            await transaction.CommitAsync(cancellationToken);
            return true;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IEnumerable<Credito>> GetCreditosExtrasAsync(int? idMatricula, CancellationToken cancellationToken)
    {
        var query = _context.Credito
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdEspecieNavigation)
            .Include(c => c.IdEspecieCicloNavigation)
                .ThenInclude(ec => ec.IdMallaNavigation)
                    .ThenInclude(m => m.IdCicloNavigation)
            .Include(c => c.IdMatriculaNavigation)
                .ThenInclude(m => m.IdUsuarioAlumnoNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
            .Include(c => c.IdMatriculaNavigation)
                .ThenInclude(m => m.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(c => c.DetalleCredito)
                .ThenInclude(dc => dc.PagoCuota)
                    .ThenInclude(pc => pc.IdPagoNavigation)
            .Where(c => c.IdEspecieCicloNavigation != null 
                     && c.IdEspecieCicloNavigation.IdEspecieNavigation != null
                     && !c.IdEspecieCicloNavigation.IdEspecieNavigation.EsMatricula
                     && !c.IdEspecieCicloNavigation.IdEspecieNavigation.EsPension);

        if (idMatricula.HasValue && idMatricula.Value > 0)
        {
            query = query.Where(c => c.IdMatricula == idMatricula.Value);
        }

        return await query.OrderByDescending(c => c.CreatedAt).ToListAsync(cancellationToken);
    }
}
