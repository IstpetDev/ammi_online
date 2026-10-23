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
        string? estadoPago = null,
        int? limite = null,
        CancellationToken cancellationToken = default)
    {
        // Consulta base con todas las relaciones necesarias
        var query = _context.Pago
            .AsNoTracking()
            .Include(dp => dp.IdEstadoPagoNavigation)
            .Include(ad => ad.UrlComprobanteNavigation)
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
            .Include(p => p.IdCuentaBancariaNavigation)
            .Include(p => p.UsuarioApruebaNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(p => p.IdClienteNavigation)
            .AsQueryable();

        // Filtro por EstadoPago si se proporciona (ex: "PENDIENTE", "APROBADO", etc.)
        if (!string.IsNullOrWhiteSpace(estadoPago) && !estadoPago.Equals("TODOS", StringComparison.OrdinalIgnoreCase))
        {
            var est = estadoPago.Trim().ToUpper();
            query = query.Where(p => p.IdEstadoPagoNavigation != null && p.IdEstadoPagoNavigation.Detalle.ToUpper() == est);
        }

        // Si se busca por Documento, prevalece sobre rangos de fecha (filtros excluyentes ganando documento)
        if (!string.IsNullOrWhiteSpace(documento))
        {
            var doc = documento.Trim();
            query = query.Where(p =>
                (p.PagoCuota.Any(pc =>
                    pc.IdDetalleCreditoNavigation.IdCreditoNavigation.IdMatriculaNavigation
                        .IdUsuarioAlumnoNavigation.IdPersonaNavigation.Documento == doc))
                || (p.IdClienteNavigation != null && p.IdClienteNavigation.Documento == doc));
        }
        else
        {
            // Solo si NO se busca por documento, se aplican los filtros de fecha
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
        }

        if (idMatricula.HasValue)
        {
            query = query.Where(p => p.PagoCuota.Any(pc =>
                pc.IdDetalleCreditoNavigation.IdCreditoNavigation.IdMatricula == idMatricula));
        }

        query = query.OrderByDescending(p => p.FechaPago).ThenByDescending(p => p.IdPago);

        if (limite.HasValue && limite.Value > 0)
        {
            query = query.Take(limite.Value);
        }

        return await query.ToListAsync(cancellationToken);
    }
}
