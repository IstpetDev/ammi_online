using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class PagoRepository : IPagoRepository
{
    private readonly Ammi_OnlineContext _context;

    public PagoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Pago>> GetByClienteDocumentoAsync(string documento, CancellationToken cancellationToken)
    {
        return await _context.Pago
            .AsNoTracking()
            .Include(p => p.IdTipoPagoNavigation)
            .Include(p => p.IdEstadoPagoNavigation)
            .Include(p => p.IdClienteNavigation)
            .Include(p => p.PagoCuota)
                .ThenInclude(pc => pc.IdDetalleCreditoNavigation)
                    .ThenInclude(dc => dc.IdCreditoNavigation)
                        .ThenInclude(c => c.IdMatriculaNavigation)
            .Include(p => p.PagoCuota)
                .ThenInclude(pc => pc.IdDetalleCreditoNavigation)
                    .ThenInclude(dc => dc.IdCreditoNavigation)
                        .ThenInclude(c => c.IdEspecieCicloNavigation)
                            .ThenInclude(ec => ec.IdEspecieNavigation)
            .Where(p => p.IdClienteNavigation.Documento == documento)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Pago>> GetByAlumnoDocumentoAsync(string documento, CancellationToken cancellationToken)
    {
        return await _context.Pago
            .AsNoTracking()
            .Include(p => p.IdTipoPagoNavigation)
            .Include(p => p.IdEstadoPagoNavigation)
            .Include(p => p.IdClienteNavigation)
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
            .Where(p => p.PagoCuota.Any(pc =>
                pc.IdDetalleCreditoNavigation.IdCreditoNavigation.IdMatriculaNavigation
                    .IdUsuarioAlumnoNavigation.IdPersonaNavigation.Documento == documento))
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Pago>> GetByMatriculaAsync(int idMatricula, CancellationToken cancellationToken)
    {
        return await _context.Pago
            .AsNoTracking()
            .Include(p => p.IdTipoPagoNavigation)
            .Include(p => p.IdEstadoPagoNavigation)
            .Include(p => p.IdClienteNavigation)
            .Include(p => p.PagoCuota)
                .ThenInclude(pc => pc.IdDetalleCreditoNavigation)
                    .ThenInclude(dc => dc.IdCreditoNavigation)
                        .ThenInclude(c => c.IdMatriculaNavigation)
            .Include(p => p.PagoCuota)
                .ThenInclude(pc => pc.IdDetalleCreditoNavigation)
                    .ThenInclude(dc => dc.IdCreditoNavigation)
                        .ThenInclude(c => c.IdEspecieCicloNavigation)
                            .ThenInclude(ec => ec.IdEspecieNavigation)
            .Where(p => p.PagoCuota.Any(pc =>
                pc.IdDetalleCreditoNavigation.IdCreditoNavigation.IdMatricula == idMatricula))
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Pago>> GetPagosNoCanceladosAsync(int? idMatricula, string? documentoCliente, string? documentoAlumno, CancellationToken cancellationToken)
    {
        var estadoCancelado = await _context.EstadoPago.FirstOrDefaultAsync(e => e.EsCancelado, cancellationToken);
        int idEstadoCancelado = estadoCancelado?.IdEstadoPago ?? 0;

        var query = _context.Pago
            .AsNoTracking()
            .Include(p => p.IdTipoPagoNavigation)
            .Include(p => p.IdEstadoPagoNavigation)
            .Include(p => p.IdClienteNavigation)
            .Include(p => p.PagoCuota)
                .ThenInclude(pc => pc.IdDetalleCreditoNavigation)
                    .ThenInclude(dc => dc.IdCreditoNavigation)
                        .ThenInclude(c => c.IdMatriculaNavigation)
            .Include(p => p.PagoCuota)
                .ThenInclude(pc => pc.IdDetalleCreditoNavigation)
                    .ThenInclude(dc => dc.IdCreditoNavigation)
                        .ThenInclude(c => c.IdEspecieCicloNavigation)
                            .ThenInclude(ec => ec.IdEspecieNavigation)
            .Where(p => p.FechaEliminacion == null);

        if (idEstadoCancelado != 0)
        {
            query = query.Where(p => p.IdEstadoPago != idEstadoCancelado);
        }

        if (idMatricula.HasValue)
        {
            query = query.Where(p => p.PagoCuota.Any(pc =>
                pc.IdDetalleCreditoNavigation.IdCreditoNavigation.IdMatricula == idMatricula.Value));
        }
        else if (!string.IsNullOrEmpty(documentoCliente))
        {
            query = query.Where(p => p.IdClienteNavigation.Documento == documentoCliente);
        }
        else if (!string.IsNullOrEmpty(documentoAlumno))
        {
            query = query.Where(p => p.PagoCuota.Any(pc =>
                pc.IdDetalleCreditoNavigation.IdCreditoNavigation.IdMatriculaNavigation
                    .IdUsuarioAlumnoNavigation.IdPersonaNavigation.Documento == documentoAlumno));
        }

        return await query.ToListAsync(cancellationToken);
    }
}