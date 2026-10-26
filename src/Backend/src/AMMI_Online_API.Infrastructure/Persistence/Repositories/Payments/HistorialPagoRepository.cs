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

    public async Task<(IEnumerable<Pago> Items, int TotalCount)> GetHistorialPagosPagedAsync(
        string? documento,
        int? idMatricula,
        DateOnly? fechaDesde,
        DateOnly? fechaHasta,
        bool? esValidado,
        string? estadoPago = null,
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = BuildFilterQuery(documento, idMatricula, fechaDesde, fechaHasta, estadoPago);

        var totalCount = await baseQuery.CountAsync(cancellationToken);

        var query = ApplyIncludes(baseQuery)
            .OrderByDescending(p => p.FechaPago)
            .ThenByDescending(p => p.IdPago);

        if (pageNumber > 0 && pageSize > 0)
        {
            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (items, totalCount);
        }
        else
        {
            var items = await query.ToListAsync(cancellationToken);
            return (items, totalCount);
        }
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
        var baseQuery = BuildFilterQuery(documento, idMatricula, fechaDesde, fechaHasta, estadoPago);

        var query = ApplyIncludes(baseQuery)
            .OrderByDescending(p => p.FechaPago)
            .ThenByDescending(p => p.IdPago);

        if (limite.HasValue && limite.Value > 0)
        {
            query = (IOrderedQueryable<Pago>)query.Take(limite.Value);
        }

        return await query.ToListAsync(cancellationToken);
    }

    private IQueryable<Pago> BuildFilterQuery(
        string? documento,
        int? idMatricula,
        DateOnly? fechaDesde,
        DateOnly? fechaHasta,
        string? estadoPago)
    {
        var query = _context.Pago.AsNoTracking().AsQueryable();

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

        return query;
    }

    private IQueryable<Pago> ApplyIncludes(IQueryable<Pago> query)
    {
        return query
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
            .Include(p => p.IdClienteNavigation);
    }
}
