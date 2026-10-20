using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Adjuntos.Queries;
using AMMI_Online_API.Domain.Interfaces.Adjuntos;
using MediatR;


namespace AMMI_Online_API.Application.Features.Adjuntos.Handlers;

public class AdjuntoHandler :
    IRequestHandler<GetAdjuntoByIdQuery, Response<AdjuntoDownloadDTO>>
{
    private readonly IAdjuntos _adjuntosRepo;

    public AdjuntoHandler(IAdjuntos adjuntosRepo)
    {
        _adjuntosRepo = adjuntosRepo;
    }

    public async Task<Response<AdjuntoDownloadDTO>> Handle(GetAdjuntoByIdQuery request, CancellationToken ct)
    {
        try
        {
            // 1. Get Metadata to know filename/extension
            var adjunto = await _adjuntosRepo.GetByIdAsync(request.IdAdjunto, ct);
            if (adjunto == null)
                return Response<AdjuntoDownloadDTO>.Failure("Archivo no encontrado en base de datos");

            // 2. Get File Content
            var content = await _adjuntosRepo.DescargarArchivoAsync(request.IdAdjunto, ct);

            // 3. Determine MIME type (Simplified)
            string contentType = "application/octet-stream";
            string extension = Path.GetExtension(adjunto.Path).ToLowerInvariant();
            if (extension == ".pdf") contentType = "application/pdf";
            else if (extension == ".jpg" || extension == ".jpeg") contentType = "image/jpeg";
            else if (extension == ".png") contentType = "image/png";

            // 4. Return DTO
            return Response<AdjuntoDownloadDTO>.Success(new AdjuntoDownloadDTO
            {
                Content = content,
                ContentType = contentType,
                FileName = Path.GetFileName(adjunto.Path) // Or just the unique name
            }, "Archivo recuperado exitosamente");
        }
        catch (FileNotFoundException)
        {
             return Response<AdjuntoDownloadDTO>.Failure("Archivo físico no encontrado en el servidor");
        }
        catch (Exception ex)
        {
             return Response<AdjuntoDownloadDTO>.Failure($"Error al recuperar archivo: {ex.Message}");
        }
    }
}
