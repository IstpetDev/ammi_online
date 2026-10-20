using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;
using System.Collections.Generic;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public record GetCreditosSimpleByMatriculaQuery(int IdMatricula) : IRequest<Response<IEnumerable<CreditoSimpleDTO>>>;

public record GetDetallesByCreditoQuery(int IdCredito) : IRequest<Response<IEnumerable<DetalleCreditoDTO>>>;
