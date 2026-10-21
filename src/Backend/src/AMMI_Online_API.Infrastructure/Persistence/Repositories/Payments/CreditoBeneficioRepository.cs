using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class CreditoBeneficioRepository : ICreditoBeneficioRepository
{
    private readonly Ammi_OnlineContext _context;

    public CreditoBeneficioRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task AddAsync(CreditoBeneficio entity, CancellationToken cancellationToken)
    {
        entity.FechaAplicacion = DateTime.Now;
        await _context.CreditoBeneficio.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExistsAsync(int idEstudianteBeneficio, int idCredito, CancellationToken cancellationToken)
    {
        return await _context.CreditoBeneficio
            .AnyAsync(cb => cb.IdEstudianteBeneficio == idEstudianteBeneficio && cb.IdCredito == idCredito, cancellationToken);
    }
}