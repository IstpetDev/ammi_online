namespace AMMI_Online_API.Application.DTOs.Payments;

public record CuentaBancariaDTO
{
    public int IdCuentaBancaria { get; set; }
    public int IdTipoCuenta { get; set; }
    public string NumeroCuenta { get; set; }
    public string Banco { get; set; }
    public bool Activo { get; set; }
}

public record CreateCuentaBancariaDTO
{
    public int IdTipoCuenta { get; set; }
    public string NumeroCuenta { get; set; }
    public string Banco { get; set; }
    public bool Activo { get; set; }
}

public record UpdateCuentaBancariaDTO
{
    public int IdCuentaBancaria { get; set; }
    public int IdTipoCuenta { get; set; }
    public string NumeroCuenta { get; set; }
    public string Banco { get; set; }
    public bool Activo { get; set; }
}
