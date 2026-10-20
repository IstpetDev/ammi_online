using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public record GetCreditosByMatriculaQuery(int IdMatricula)
    : IRequest<Response<IEnumerable<CreditoDTO>>>;
