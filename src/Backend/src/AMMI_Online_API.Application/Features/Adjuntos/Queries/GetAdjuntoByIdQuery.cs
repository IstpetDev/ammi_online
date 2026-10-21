using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Adjuntos.Queries;

public record AdjuntoDownloadDTO
{
    public byte[] Content { get; init; } = Array.Empty<byte>();
    public string ContentType { get; init; }
    public string FileName { get; init; } = string.Empty;
}

public record GetAdjuntoByIdQuery(int IdAdjunto) : IRequest<Response<AdjuntoDownloadDTO>>;
