using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Queries;

public record GetAllModuloQuery() : IRequest<Response<IEnumerable<ModuloDTO>>>;
