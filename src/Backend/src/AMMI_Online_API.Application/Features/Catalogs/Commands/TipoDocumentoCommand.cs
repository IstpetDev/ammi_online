using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoDocumentoCommand(CreateTipoDocumentoDTO tipoDocumentoDTO) : IRequest<Response<int>>;
public record UpdateTipoDocumentoCommand(UpdateTipoDocumentoDTO tipoDocumentoDTO) : IRequest<Response<bool>>;
public record DeleteTipoDocumentoCommand(int IdTipoDocumento) : IRequest<Response<bool>>;
