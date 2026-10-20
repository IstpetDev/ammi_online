using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoDiscapacidadCommand(CreateTipoDiscapacidadDTO tipoDiscapacidadDTO) : IRequest<Response<int>>;
public record UpdateTipoDiscapacidadCommand(UpdateTipoDiscapacidadDTO tipoDiscapacidadDTO) : IRequest<Response<bool>>;
public record DeleteTipoDiscapacidadCommand(int IdTipoDiscapacidad) : IRequest<Response<bool>>;
