using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public record GetAllEspecieCicloQuery() : IRequest<Response<IEnumerable<EspecieCicloDTO>>>;

public record GetEspecieCicloByMallaQuery(int IdMalla) : IRequest<Response<IEnumerable<EspecieCicloDTO>>>;

public record GetEspecieCicloByIdQuery(int IdEspecieCiclo) : IRequest<Response<EspecieCicloDTO>>;
