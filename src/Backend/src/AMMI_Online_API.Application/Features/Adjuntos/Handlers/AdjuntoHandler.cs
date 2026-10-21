using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Adjuntos.Queries;
using AMMI_Online_API.Application.Features.Adjuntos.Commands;
using AMMI_Online_API.Domain.Interfaces.Adjuntos;
using MediatR;


namespace AMMI_Online_API.Application.Features.Adjuntos.Handlers;

public class AdjuntoHandler :
    IRequestHandler<GetAdjuntoByIdQuery, Response<AdjuntoDownloadDTO>>,
    IRequestHandler<DeleteAdjuntoCommand, Response<bool>>
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
            else if (extension == ".doc" || extension == ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if (extension == ".xls" || extension == ".xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            else if (extension == ".txt") contentType = "text/plain";
            else if (extension == ".zip") contentType = "application/zip";
            else if (extension == ".csv") contentType = "text/csv";
            else if (extension == ".ppt" || extension == ".pptx") contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            else if (extension == ".webp") contentType = "image/webp";

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
    public async Task<Response<bool>> Handle(DeleteAdjuntoCommand request, CancellationToken ct)
    {
        var result = await _adjuntosRepo.EliminarArchivoAsync(request.Id, ct);
        if (result)
            return Response<bool>.Success(true, "Adjunto eliminado exitosamente (base de datos y físico)");
        
        return Response<bool>.Failure("No se pudo eliminar el adjunto o no existe");
    }
}
