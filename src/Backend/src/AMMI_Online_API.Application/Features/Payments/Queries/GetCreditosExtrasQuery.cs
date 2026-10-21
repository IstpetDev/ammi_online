using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public record GetCreditosExtrasQuery(int? IdMatricula = null) : IRequest<Response<IEnumerable<CreditoExtraItemDTO>>>;
