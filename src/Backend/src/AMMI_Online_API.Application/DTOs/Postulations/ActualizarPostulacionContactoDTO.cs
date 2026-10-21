namespace AMMI_Online_API.Application.DTOs.Postulations;

public class ActualizarPostulacionContactoDTO
{
    public int IdPersona { get; set; }
    public int IdPostulacion { get; set; }

    public int IdTipoDocumento { get; set; }
    public string Documento { get; set; }
    public int IdGenero { get; set; }
    public string PrimerNombre { get; set; }
    public string? SegundoNombre { get; set; }
    public string PrimerApellido { get; set; }
    public string? SegundoApellido { get; set; }

    public DateOnly? FechaNacimiento { get; set; }
    public int? IdEstadoCivil { get; set; }
    public int? IdNacionalidadEtnica { get; set; }

    public DatosContactoItem[] DatosContactos { get; set; } = Array.Empty<DatosContactoItem>();

    public int IdParroquia { get; set; }
    public string DireccionDomiciliaria { get; set; }

    public int? IdTipoActividadEconomica { get; set; }
    public decimal? Valor { get; set; }
    public bool? EsPrincipal { get; set; }
    public bool? Activo { get; set; }

    public int? Porcentaje { get; set; }
    public string? Recomendaciones { get; set; }
    public int? IdTipoDiscapacidad { get; set; }

    public int IdPais { get; set; }
    public string? Nacio { get; set; }

    public DocumentosPersonalesItem[] DocumentosPersonales { get; set; } = Array.Empty<DocumentosPersonalesItem>();

    public int IdMalla { get; set; }
    public int IdParalelo { get; set; }
}
