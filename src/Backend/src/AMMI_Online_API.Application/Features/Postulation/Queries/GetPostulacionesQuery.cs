using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Queries;

public record GetPostulacionesQuery : IRequest<Response<IEnumerable<PostulacionDTO>>>;
