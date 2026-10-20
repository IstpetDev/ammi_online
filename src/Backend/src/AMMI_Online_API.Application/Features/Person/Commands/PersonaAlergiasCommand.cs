using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Commands;

public class CreatePersonaAlergiasCommand : IRequest<Response<int>>
{
    public CreatePersonaAlergiasItem[] PersonaAlergias { get; set; } = Array.Empty<CreatePersonaAlergiasItem>();
}
public record CreatePersonaAlergiasItem
{
    public int IdPersonaAlergias { get; set; }
    public string Detalle { get; set; }
    public int IdTipoAlergia { get; set; }
    public int IdPersona { get; set; }

}
public record UpdatePersonaAlergiasCommand(
    int IdPersonaAlergias,
    int IdPersona,
    string Detalle,
    int IdTipoAlergia
    ) : IRequest<Response<bool>>;
public record DeletePersonaAlergiasCommand(int IdPersonaAlergias) : IRequest<Response<bool>>;
