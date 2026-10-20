using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class HistorialPagoRepository : IHistorialPagoRepository
{
    private readonly Ammi_OnlineContext _context;

    public HistorialPagoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Pago>> GetHistorialPagosAsync(
        string? documento,
        int? idMatricula,
        DateOnly? fechaDesde,
        DateOnly? fechaHasta,
        bool? esValidado,
        CancellationToken cancellationToken)
    {
        // Consulta base con todas las relaciones necesarias
        var query = _context.Pago
            .Include(p => p.PagoCuota)
                .ThenInclude(pc => pc.IdDetalleCreditoNavigation)
                    .ThenInclude(dc => dc.IdCreditoNavigation)
                        .ThenInclude(c => c.IdMatriculaNavigation)
                            .ThenInclude(m => m.IdUsuarioAlumnoNavigation)
                                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(p => p.PagoCuota)
                .ThenInclude(pc => pc.IdDetalleCreditoNavigation)
                    .ThenInclude(dc => dc.IdCreditoNavigation)
                        .ThenInclude(c => c.IdEspecieCicloNavigation)
                            .ThenInclude(ec => ec.IdEspecieNavigation)
            .Include(p => p.IdTipoPagoNavigation)
            .AsQueryable();

        // Filtros
        if (!string.IsNullOrEmpty(documento))
        {
            query = query.Where(p => p.PagoCuota.Any(pc =>
                pc.IdDetalleCreditoNavigation.IdCreditoNavigation.IdMatriculaNavigation
                    .IdUsuarioAlumnoNavigation.IdPersonaNavigation.Documento == documento));
        }

        if (idMatricula.HasValue)
        {
            query = query.Where(p => p.PagoCuota.Any(pc =>
                pc.IdDetalleCreditoNavigation.IdCreditoNavigation.IdMatricula == idMatricula));
        }

        if (fechaDesde.HasValue)
        {
            var desde = fechaDesde.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(p => p.FechaPago >= desde);
        }

        if (fechaHasta.HasValue)
        {
            var hasta = fechaHasta.Value.ToDateTime(TimeOnly.MaxValue);
            query = query.Where(p => p.FechaPago <= hasta);
        }

        if (esValidado.HasValue)
        {
            query = query.Where(p => p.EsValidado == esValidado);
        }

        return await query
            .OrderByDescending(p => p.FechaPago)
            .ToListAsync(cancellationToken);
    }
}