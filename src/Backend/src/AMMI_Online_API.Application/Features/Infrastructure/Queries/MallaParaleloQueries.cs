using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;
using System.Collections.Generic;

namespace AMMI_Online_API.Application.Features.Infrastructure.Queries;

public record GetMallaParaleloByMallaQuery(int IdMalla) : IRequest<Response<IEnumerable<MallaParaleloDTO>>>;
