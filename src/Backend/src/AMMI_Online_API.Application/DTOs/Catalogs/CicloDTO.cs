namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record CicloDTO
{
    public int IdCiclo { get; set; }
    public int? IdPadre { get; set; }
    public int IdPeriodo { get; set; }
    public int IdRegimen { get; set; }
    public string Detalle { get; set; }
    public DateOnly? FechaInicioEstimada { get; set; }
    public DateOnly? FechaFinEstimada { get; set; }
    public bool EsActivo { get; set; }

    // NUEVO: Datos relacionados
    public string NombrePeriodo { get; set; }
    public string NombreRegimen { get; set; }
    public string NombreCicloPadre { get; set; }
}

public record CreateCicloDTO
{
    public int? IdPadre { get; set; }
    public int IdPeriodo { get; set; }
    public int IdRegimen { get; set; }
    public string Detalle { get; set; }
    public DateOnly? FechaInicioEstimada { get; set; }
    public DateOnly? FechaFinEstimada { get; set; }
    public bool EsActivo { get; set; }
}

public record UpdateCicloDTO
{
    public int IdCiclo { get; set; }
    public int? IdPadre { get; set; }
    public int IdPeriodo { get; set; }
    public int IdRegimen { get; set; }
    public string Detalle { get; set; }
    public DateOnly? FechaInicioEstimada { get; set; }
    public DateOnly? FechaFinEstimada { get; set; }
    public bool EsActivo { get; set; }
}

public record CicloConMallasDTO
{
    public int IdCiclo { get; set; }
    public string Detalle { get; set; }
    public bool EsActivo { get; set; }
    public DateOnly? FechaInicioEstimada { get; set; }
    public DateOnly? FechaFinEstimada { get; set; }

    public List<MallaSimpleDTO> Mallas { get; set; } = new();
}

public record MallaSimpleDTO
{
    public int IdMalla { get; set; }
    public string Detalle { get; set; }
    public string NombreCurso { get; set; }
}
