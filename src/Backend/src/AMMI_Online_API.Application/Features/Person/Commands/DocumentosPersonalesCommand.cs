using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Application.Features.Person.Commands;

public class CreateDocumentosPersonalesCommand : IRequest<Response<int>>
{
    public string DocumentosPersonalesJson { get; set; } = string.Empty;
    public List<IFormFile>? ArchivosDocumentos { get; set; }
}

public class CreateDocumentosPersonalesItem
{
    public int IdPersona { get; set; }
    public int IdTipoDocumentoPersonal { get; set; }
    public string? CodigoRequisito { get; set; }
    public bool? Estado { get; set; }
    public bool? ValorDato { get; set; }
    public string? Observacion { get; set; }
    public bool TieneArchivo { get; set; }
}
public class UpdateDocumentosPersonalesCommand : IRequest<Response<bool>>
{
    public int IdDocumentosPersonales { get; set; }
    public int IdPersona { get; set; }
    public int IdTipoDocumentoPersonal { get; set; }
    public string? CodigoRequisito { get; set; }
    public bool? Estado { get; set; }
    public bool? ValorDato { get; set; }
    public string? Observacion { get; set; }
    public IFormFile? ArchivoDocumento { get; set; }
}
public record DeleteDocumentosPersonalesCommand(int IdDocumentosPersonales) : IRequest<Response<bool>>;
