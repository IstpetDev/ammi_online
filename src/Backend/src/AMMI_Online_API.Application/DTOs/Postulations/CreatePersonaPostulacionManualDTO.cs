namespace AMMI_Online_API.Application.DTOs.Postulations;

public class CreatePersonaPostulacionManualDTO
{
    // Create Persona
    public int IdTipoDocumento { get; set; }
    public string Documento { get; set; }
    public int IdGenero { get; set; }
    public string PrimerNombre { get; set; }
    public string SegundoNombre { get; set; }
    public string PrimerApellido { get; set; }
    public string SegundoApellido { get; set; }

    // Create PersonaInfo
    public DateOnly? FechaNacimiento { get; set; }
    public int? IdEstadoCivil { get; set; }
    public int? IdNacionalidadEtnica { get; set; }
    public int? IdTipoSangre { get; set; }

    // Create Datos Contacto
    public DatosContactoItem[] DatosContactos { get; set; } = Array.Empty<DatosContactoItem>();

    // Create Dirección
    public int IdParroquia { get; set; }
    public string DireccionDomiciliaria { get; set; }

    // Create Actividad Economica
    public int? IdTipoActividadEconomica { get; set; }
    public decimal? Valor { get; set; }
    public bool? EsPrincipal { get; set; }
    public bool? Activo { get; set; }

    // Create Discapacidad (AHORA OPCIONAL)
    public int? Porcentaje { get; set; }
    public string? Recomendaciones { get; set; }
    public int? IdTipoDiscapacidad { get; set; }

    // Create Nacionalidad
    public int IdPais { get; set; }

    // Create Documentos Personales
    public DocumentosPersonalesItem[] DocumentosPersonales { get; set; } = Array.Empty<DocumentosPersonalesItem>();

    //Matricula
    public int IdMalla { get; set; }
    public int IdParalelo { get; set; }

    //Crédito y pago
    public bool RealizarPagoInicial { get; set; }
    public decimal? MontoPagoInicial { get; set; }
    public int? IdTipoPago { get; set; }
}

public class DocumentosPersonalesItem
{
    public int IdTipoDocumentoPersonal { get; set; }
    public bool? Estado { get; set; }
    public bool? ValorDato { get; set; }
    public string CodigoRequisito { get; set; }
    public string? Observacion { get; set; }
    public bool TieneArchivo { get; set; }
}

public class DatosContactoItem
{
    public int IdTipoDatoContacto { get; set; }
    public string Detalle { get; set; }
    public bool EsPrincipal { get; set; }
}