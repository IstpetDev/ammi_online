using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoDocumentoPersonalCommand(CreateTipoDocumentoPersonalDTO tipoDocumentoPersonalDTO) : IRequest<Response<int>>;
public record UpdateTipoDocumentoPersonalCommand(UpdateTipoDocumentoPersonalDTO tipoDocumentoPersonalDTO) : IRequest<Response<bool>>;
public record DeleteTipoDocumentoPersonalCommand(int IdTipoDocumentoPersonal) : IRequest<Response<bool>>;
