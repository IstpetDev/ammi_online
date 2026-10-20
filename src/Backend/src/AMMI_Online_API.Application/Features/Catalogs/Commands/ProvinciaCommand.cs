using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateProvinciaCommand(CreateProvinciaDTO provinciaDTO) : IRequest<Response<int>>;
public record UpdateProvinciaCommand(UpdateProvinciaDTO provinciaDTO) : IRequest<Response<bool>>;
public record DeleteProvinciaCommand(int IdProvincia) : IRequest<Response<bool>>;
