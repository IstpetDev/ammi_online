using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.ChatBot;

public interface IChatBotRepository
{
    Task<IEnumerable<Ciclo>> GetActiveInformationAsync(DateOnly fechaActual, CancellationToken cancellationToken);
}
