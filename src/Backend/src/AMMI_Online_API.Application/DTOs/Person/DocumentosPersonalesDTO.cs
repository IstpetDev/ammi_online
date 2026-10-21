using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Application.DTOs.Person;

public record DocumentosPersonalesDTO
{
    public int IdDocumentosPersonales { get; set; }
    public int IdTipoDocumentoPersonal { get; set; }
    public int IdPersona { get; set; }
    public int? IdAdjunto { get; set; }
    public string CodigoRequisito { get; set; }
    /// <summary>
    /// aprobado = true
    /// rechazado = false
    /// entrego = null
    /// </summary>
    public bool? Estado { get; set; }
    public bool? ValorDato { get; set; }
    public string Observacion { get; set; }
    public string? Path { get; set; }
}

public record CreateDocumentosPersonalesDTO
{
    public int IdTipoDocumentoPersonal { get; set; }
    public int IdPersona { get; set; }
    public IFormFile? Archivo { get; set; }
    public string CodigoRequisito { get; set; }
    /// <summary>
    /// aprobado = true
    /// rechazado = false
    /// entrego = null
    /// </summary>
    public bool? Estado { get; set; }
    public bool? ValorDato { get; set; }
    public string Observacion { get; set; }
}

public record UpdateDocumentosPersonalesDTO
{
    public int IdDocumentosPersonales { get; set; }
    public int IdTipoDocumentoPersonal { get; set; }
    public int IdPersona { get; set; }
    public int? IdAdjunto { get; set; }
    public string CodigoRequisito { get; set; }
    /// <summary>
    /// aprobado = true
    /// rechazado = false
    /// entrego = null
    /// </summary>
    public bool? Estado { get; set; }
    public bool? ValorDato { get; set; }
    public string Observacion { get; set; }
}
