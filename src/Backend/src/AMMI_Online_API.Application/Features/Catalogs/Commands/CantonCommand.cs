using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateCantonCommand(CreateCantonDTO cantonDTO) : IRequest<Response<int>>;
public record UpdateCantonCommand(UpdateCantonDTO cantonDTO) : IRequest<Response<bool>>;
public record DeleteCantonCommand(int IdCanton) : IRequest<Response<bool>>;
