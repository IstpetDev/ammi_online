using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoParentescoCommand(CreateTipoParentescoDTO tipoParentescoDTO) : IRequest<Response<int>>;
public record UpdateTipoParentescoCommand(UpdateTipoParentescoDTO tipoParentescoDTO) : IRequest<Response<bool>>;
public record DeleteTipoParentescoCommand(int IdTipoParentesco) : IRequest<Response<bool>>;