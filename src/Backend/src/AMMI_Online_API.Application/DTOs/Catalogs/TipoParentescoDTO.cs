namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoParentescoDTO
{
    public int IdTipoParentesco { get; set; }
    public string Detalle { get; set; }
    public int GradoConsanguinidad { get; set; }
}

public record CreateTipoParentescoDTO
{
    public required string Detalle { get; set; }
    public required int GradoConsanguinidad { get; set; }
}

public record UpdateTipoParentescoDTO
{
    public required int IdTipoParentesco { get; set; }
    public required string Detalle { get; set; }
    public required int GradoConsanguinidad { get; set; }
}


