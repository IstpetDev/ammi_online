using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateEstadoCivilCommand(EstadoCivilCreateDTO estadoCivilDTO) : IRequest<Response<int>>;
public record UpdateEstadoCivilCommand(EstadoCivilUpdateDTO estadoCivilDTO) : IRequest<Response<bool>>;
public record DeleteEstadoCivilCommand(int IdEstadoCivil) : IRequest<Response<bool>>;
