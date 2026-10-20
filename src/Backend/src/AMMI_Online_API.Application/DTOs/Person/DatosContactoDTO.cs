namespace AMMI_Online_API.Application.DTOs.Person;

public record DatosContactoDTO
{
    public int IdDatosContacto { get; set; }
    public int IdTipoDatoContacto { get; set; }
    public int IdPersona { get; set; }
    public string Detalle { get; set; }
    public bool EsPrincipal { get; set; }
}

public record CreateDatosContactoDTO
{
    public int IdTipoDatoContacto { get; set; }
    public int IdPersona { get; set; }
    public string Detalle { get; set; }
    public bool EsPrincipal { get; set; }
}

public record UpdateDatosContactoDTO
{
    public int IdTipoDatoContacto { get; set; }
    public int IdPersona { get; set; }
    public string Detalle { get; set; }
    public bool EsPrincipal { get; set; }
}
