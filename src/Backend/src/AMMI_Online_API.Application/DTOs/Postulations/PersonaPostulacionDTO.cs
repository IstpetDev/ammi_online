

namespace AMMI_Online_API.Application.DTOs.Postulations;

public record PersonaPostulacionDTO
{
    public int IdPostulacion { get; set; }
    public int IdPersona { get; set; }
    public string? ObservacionesRevision { get; set; }
    public bool? EsPostulacionRapida { get; set; }
    public string? ObservacionesPostulante { get; set; }
    public System.DateTime? FechaPostulacion { get; set; }
    public PersonaSimp personasimple { get; set; }
    public TipoEstadoAprobacionSimp tipoestadoaprobacion { get; set; }
    public MallaSimp malla { get; set; }

}
public record TipoEstadoAprobacionSimp
{
    public string Detalle { get; set; }
}
public record MallaSimp
{
    public int IdMalla { get; set; }
    public string Detalle { get; set; }
    public CursosSimp curso { get; set; }
    public TipoOfertaSimp tipooferta { get; set; }
    public MallaCicloSimp mallaCiclo { get; set; }
}
public record CursosSimp
{
    public string Detalle { get; set; }
}

public record TipoOfertaSimp
{
    public string Detalle { get; set; }
}

public record MallaCicloSimp
{
public CicloSimp Ciclo { get; set; }
}

public record CicloSimp
{
    public PeriodoSimp periodo { get; set; }
    public RegimenSimp regimen { get; set; }
    public string Detalle { get; set; }
    public DateOnly? FechaInicioEstimada { get; set; }
    public DateOnly? FechaFinEstimada { get; set; }
}

public record PeriodoSimp
{
    public string Detalle { get; set; }
}

public record RegimenSimp
{
    public string Detalle { get; set; }
}

public record PersonaSimp
{
    public string Documento { get; set; }
    public string PrimerNombre { get; set; }
    public string SegundoNombre { get; set; }
    public string PrimerApellido { get; set; }
    public string SegundoApellido { get; set; }
    public GeneroSimp generosimple { get; set; }
    public PersonaInformacionSimp pinfo { get; set; }
    public virtual PersonaDiscapacidadSimp pdiscapacidad { get; set; }
    public virtual PersonaActividadEconomicaSimp pactividadeconomica { get; set; }
    public virtual List<PersonaContactoSimp> pcontacto { get; set;}
    public virtual PersonaDocumentosSimp pdocumentos { get; set; }
    public virtual PersonaDireccionSimp pdireccion { get; set; }
}

public record GeneroSimp
{
    public string Nombre { get; set; }
}

public record PersonaDiscapacidadSimp
{
    public TipoDiscapacdidadSimp tipodiscpacidad { get; set; }
    public int Porcentaje { get; set; }
    public string Recomendaciones { get; set; }
    public AdjuntoSimp pathdiscapacidad { get; set; }
}

public record TipoDiscapacdidadSimp
{
    public string Nombre { get; set; }
    public string Recomendaciones { get; set; }
}

public record PersonaActividadEconomicaSimp
{
    public TipoActividadEconomicaSimp tipoactividad { get; set; }
    public decimal? Valor { get; set; }
    public bool EsPrincipal { get; set; }
}

public record TipoActividadEconomicaSimp
{
    public string Nombre { get; set; }
}

public record PersonaContactoSimp
{
    public int? IdDatosContacto { get; set; }
    public int? IdTipoDatoContacto { get; set; }
    public bool? EsPrincipal { get; set; }
    public TipoContactoSimp tipocontacto { get; set; }
    public string Detalle { get; set; }
}

public record TipoContactoSimp
{
    public int? IdTipoDatoContacto { get; set; }
    public string Detalle { get; set; }
}
public record PersonaDocumentosSimp
{
    public TipoDocumentoPersonalSimp tipodocumentopersonal { get; set; }
    public AdjuntoSimp pathDocumento { get; set; }
    public string CodigoRequisito { get; set; }
    /// <summary>
    /// aprobado = true
    /// rechazado = false
    /// entrego = null
    /// </summary>
    public bool? Estado { get; set; }
    public string Observacion { get; set; }
}
public record TipoDocumentoPersonalSimp
{
    public string Detalle { get; set; }
}

public record PersonaDireccionSimp
{
    public string DireccionDomiciliaria { get; set; }
}

public record PersonaInformacionSimp
{
    public DateOnly? FechaNacimiento { get; set; }
    public EstadoCivilSimp estadocivil { get; set;}
    public NacionalidadSimp nacionalidadetnica { get; set; }
}
public record EstadoCivilSimp
{
    public string Nombre { get; set; }
}
public record NacionalidadSimp
{
    public string Nombre { get; set; }
    public EtniaSimp etnia { get; set; }
}

public record EtniaSimp
{
    public string Nombre { get; set; }
}

public record AdjuntoSimp
{
    public string Path { get; set; }
}