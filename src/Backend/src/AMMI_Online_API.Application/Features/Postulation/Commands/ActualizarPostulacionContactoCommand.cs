using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Application.Features.Postulation.Commands;

public class ActualizarPostulacionContactoCommand : IRequest<Response<int>>
{
    public string PersonaPostulacionManualJson { get; set; } = string.Empty;
    public IFormFile? ArchivoDiscapacidad { get; set; }
    public List<IFormFile>? ArchivosDocumentos { get; set; }
}
