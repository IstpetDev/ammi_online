using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateParroquiaCommand(CreateParroquiaDTO parroquiaDTO) : IRequest<Response<int>>;
public record UpdateParroquiaCommand(UpdateParroquiaDTO parroquiaDTO) : IRequest<Response<bool>>;
public record DeleteParroquiaCommand(int IdParroquia) : IRequest<Response<bool>>;
