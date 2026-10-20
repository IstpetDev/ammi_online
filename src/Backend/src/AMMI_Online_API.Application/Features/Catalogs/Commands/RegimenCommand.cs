using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateRegimenCommand(string Detalle) : IRequest<Response<int>>;
public record UpdateRegimenCommand(int IdRegimen, string Detalle) : IRequest<Response<bool>>;
public record DeleteRegimenCommand(int IdRegimen) : IRequest<Response<bool>>;