using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Catalogs.DTOs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries
{
    public record GetAllGenerosQuery : IRequest<Response<IEnumerable<GeneroDTO>>>;
}
