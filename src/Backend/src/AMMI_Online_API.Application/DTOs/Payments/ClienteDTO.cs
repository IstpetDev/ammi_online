namespace AMMI_Online_API.API.Controllers.Payments;

public record ClienteDTO
{
    public int IdCliente { get; set; }
    public string Documento { get; set; }
    public string Nombres { get; set; }
    public string Apellidos { get; set; }
    public string Correo { get; set; }
    public string Celular { get; set; }
    public string Direccion { get; set; }
    public bool? Activo { get; set; }
}

public record CreateClienteDTO
{
    public string Documento { get; set; }
    public string Nombres { get; set; }
    public string Apellidos { get; set; }
    public string Correo { get; set; }
    public string Celular { get; set; }
    public string Direccion { get; set; }
}

public record UpdateClienteDTO
{
    public int IdCliente { get; set; }
    public string Documento { get; set; }
    public string Nombres { get; set; }
    public string Apellidos { get; set; }
    public string Correo { get; set; }
    public string Celular { get; set; }
    public string Direccion { get; set; }
    public bool Activo { get; set; }
}
