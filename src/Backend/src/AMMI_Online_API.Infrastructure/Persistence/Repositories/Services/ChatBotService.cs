using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.ChatBot;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Services;

public class ChatBotService : IChatBotRepository
{
    private readonly Ammi_OnlineContext _context;

    public ChatBotService(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Ciclo>> GetActiveInformationAsync(DateOnly fechaActual, CancellationToken cancellationToken)
    {
        return await _context.Ciclo
            .AsNoTracking()
            .Include(c => c.IdTipoOfertaNavigation)
            .Include(c => c.IdPeriodoNavigation)
            .Include(c => c.IdRegimenNavigation)
            .Include(c => c.Malla)
                 .ThenInclude(m => m.EspecieCiclo)
                 .ThenInclude(m => m.IdEspecieNavigation)
            .Include(c => c.Malla)
                .ThenInclude(m => m.IdCursosNavigation)
            .Include(c => c.Malla)
                .ThenInclude(m => m.MallaRequisitos)
                    .ThenInclude(mr => mr.IdRequisitosNavigation)
            .Where(c => c.EsActivo 
                     && c.FechaInicioEstimada <= fechaActual 
                     && c.FechaFinEstimada >= fechaActual
                     && c.IdPeriodoNavigation.FechaInicioEstimada <= fechaActual
                     && c.IdPeriodoNavigation.FechaFinEstimada >= fechaActual)
            .ToListAsync(cancellationToken);
    }
}
