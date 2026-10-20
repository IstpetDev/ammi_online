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

    public async Task<IEnumerable<Pago>> GetByDocumentoPersonaAsync(string documento, CancellationToken cancellationToken)
    {
        // Navegación: Persona (por documento) -> Usuario -> Matricula -> Credito -> DetalleCredito -> PagoCuota -> Pago
        // Filtramos los pagos que tengan al menos una cuota asociada a un crédito cuya matrícula corresponda a la persona con el documento dado.
        return await _context.Pago
            .AsNoTracking()
            .Include(p => p.IdTipoPagoNavigation)
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
        // Filtramos los pagos que tengan al menos una cuota asociada a un crédito cuya matrícula sea la indicada.
        return await _context.Pago
            .AsNoTracking()
            .Include(p => p.IdTipoPagoNavigation)
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

    public async Task<IEnumerable<Pago>> GetPagosPendientesAsync(int? idMatricula, string? documento, CancellationToken cancellationToken)
    {
        var query = _context.Pago
            .AsNoTracking()
            .Include(p => p.IdTipoPagoNavigation)
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
            .Where(p => p.EsValidado == false); // Solo no validados

        if (idMatricula.HasValue)
        {
            query = query.Where(p => p.PagoCuota.Any(pc =>
                pc.IdDetalleCreditoNavigation.IdCreditoNavigation.IdMatricula == idMatricula.Value));
        }
        else if (!string.IsNullOrEmpty(documento))
        {
            query = query.Where(p => p.PagoCuota.Any(pc =>
                pc.IdDetalleCreditoNavigation.IdCreditoNavigation.IdMatriculaNavigation.IdUsuarioAlumnoNavigation
                    .IdPersonaNavigation.Documento == documento));
        }
        else
        {
            // Si no hay filtro, podría devolver todos o lanzar error. Decidimos devolver todos.
        }

        return await query.ToListAsync(cancellationToken);
    }
}