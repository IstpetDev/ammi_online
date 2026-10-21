using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Commands;

public record AsignarCreditoExtraCommand(AsignarCreditoExtraDTO DTO) : IRequest<Response<CreditoExtraItemDTO>>;

public record AsignarCreditoExtraMasivoCommand(AsignarCreditoExtraMasivoDTO DTO) : IRequest<Response<AsignarCreditoExtraMasivoResultDTO>>;

public record AnularCreditoExtraCommand(int IdCredito) : IRequest<Response<bool>>;
