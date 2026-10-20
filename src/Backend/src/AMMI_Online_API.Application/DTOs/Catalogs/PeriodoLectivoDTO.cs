namespace AMMI_Online_API.Application.DTOs.Catalogs;
public class PeriodoLectivoDTO
{
    public int IdPeriodoLectivo { get; set; }
    public string Detalle { get; set; }
    public DateOnly FechaInicioEstimada { get; set; }
    public DateOnly FechaFinEstimada { get; set; }
}

public class PeriodoLectivoCreateDTO
{
    public string Detalle { get; set; }
    public DateOnly FechaInicioEstimada { get; set; }
    public DateOnly FechaFinEstimada { get; set; }
}

public class PeriodoLectivoUpdateDTO
{
    public int IdPeriodoLectivo { get; set; }
    public string Detalle { get; set; }
    public DateOnly FechaInicioEstimada { get; set; }
    public DateOnly FechaFinEstimada { get; set; }
}
