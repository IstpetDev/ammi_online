using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Commands;

public record CreateEspecieCicloCommand(
    int IdMalla,
    int IdEspecie,
    decimal ValorEspecie
) : IRequest<Response<EspecieCicloDTO>>;

public record UpdateEspecieCicloValorCommand(
    int IdEspecieCiclo,
    int IdEspecie,
    decimal ValorEspecie
) : IRequest<Response<EspecieCicloDTO>>;
