using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;
using System.Collections.Generic;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public record GetPagosByMatriculaQuery(int IdMatricula) : IRequest<IEnumerable<PagoDTO>>;
