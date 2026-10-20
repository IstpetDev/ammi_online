using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateNacionalidadEtnicaCommand(CreateNacionalidadEtnicaDTO nacionalidadEtnicaDTO) : IRequest<Response<int>>;
public record UpdateNacionalidadEtnicaCommand(UpdateNacionalidadEtnicaDTO nacionalidadEtnicaDTO) : IRequest<Response<bool>>;
public record DeleteNacionalidadEtnicaCommand(int IdNacionalidadEtnica) : IRequest<Response<bool>>;
