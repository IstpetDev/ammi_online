using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreatePaisCommand(CreatePaisDTO paisDTO) : IRequest<Response<int>>;
public record UpdatePaisCommand(UpdatePaisDTO paisDTO) : IRequest<Response<bool>>;
public record DeletePaisCommand(int IdPais) : IRequest<Response<bool>>;
