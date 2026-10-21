using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Queries;

/// <summary>
/// Query para consultar si un email ya se encuentra verificado
/// </summary>
public record CheckEmailVerifiedQuery(
    string Email
) : IRequest<Response<bool>>;
