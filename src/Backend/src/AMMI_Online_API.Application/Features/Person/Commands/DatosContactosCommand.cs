using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Commands;


public class CreateDatosContactosCommand : IRequest<Response<int>>
{
    public CreateDatosContactoItem[] DatosContactos { get; set; } = Array.Empty<CreateDatosContactoItem>();
}

public class CreateDatosContactoItem
{
    public int? IdDatosContacto { get; set; }
    public int IdPersona { get; set; }
    public int IdTipoDatoContacto { get; set; }
    public string Detalle { get; set; } = string.Empty;
    public bool EsPrincipal { get; set; }
}
public record UpdateDatosContactosCommand(
    int IdDatosContacto,
    int IdPersona,
    int IdTipoDatoContacto,
    string Detalle,
    bool EsPrincipal
    ) : IRequest<Response<bool>>;
public record DeleteDatosContactosCommand(int IdDatosContacto) : IRequest<Response<bool>>;
