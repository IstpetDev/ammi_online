using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Commands;

public record AsignarBeneficioCommand(EstudianteBeneficioCreateDTO Data)
    : IRequest<Response<EstudianteBeneficioDTO>>;

public record DesactivarBeneficioCommand(EstudianteBeneficioDesactivarDTO Data)
    : IRequest<Response<bool>>;
