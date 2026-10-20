using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public record GetBeneficiosByAlumnoQuery(int IdPersona)
    : IRequest<Response<IEnumerable<EstudianteBeneficioDTO>>>;
