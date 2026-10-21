namespace AMMI_Online_API.Application.DTOs.Payments;

public class EspecieCicloDTO
{
    public int IdEspecieCiclo { get; set; }
    public int IdMalla { get; set; }
    public int IdEspecie { get; set; }
    public decimal ValorEspecie { get; set; }

    // Datos adicionales
    public string DetalleMalla { get; set; } = string.Empty;
    public string DetalleEspecie { get; set; } = string.Empty;
    public bool EsPension { get; set; }
    public bool EsMatricula { get; set; }
    public bool CicloActivo { get; set; }
}

public class CreateEspecieCicloDTO
{
    public int IdMalla { get; set; }
    public int IdEspecie { get; set; }
    public decimal ValorEspecie { get; set; }
}

public class UpdateEspecieCicloDTO
{
    public int IdEspecieCiclo { get; set; }
    public int IdEspecie { get; set; }
    public decimal ValorEspecie { get; set; }
}
