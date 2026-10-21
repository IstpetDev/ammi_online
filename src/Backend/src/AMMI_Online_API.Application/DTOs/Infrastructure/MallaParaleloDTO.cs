namespace AMMI_Online_API.Application.DTOs.Infrastructure;

public record MallaParaleloDTO
{
    public int IdMallaParalelo { get; init; }
    public int IdMalla { get; init; }
    public int IdParalelo { get; init; }
    public string NombreParalelo { get; init; } = string.Empty;
    public int? CupoMaximo { get; init; }
    public bool EsActivo { get; init; }
    public int AlumnosMatriculados { get; init; }
    public string NombreDocente { get; init; } = string.Empty;
}

public record ActivarMallaParaleloDTO
{
    public int IdMallaParalelo { get; init; }
    public bool ClonarDistributivos { get; init; }
    public int? IdMallaParaleloOrigen { get; init; }
}

public record CrearMallaParaleloDTO
{
    public int IdMalla { get; init; }
    public int IdParalelo { get; init; }
    public int? CupoMaximo { get; init; }
}
