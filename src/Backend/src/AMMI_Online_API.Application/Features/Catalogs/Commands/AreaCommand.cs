using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateAreaCommand(string Detalle) : IRequest<Response<int>>;
public record UpdateAreaCommand(int IdArea, string Detalle) : IRequest<Response<bool>>;
public record DeleteAreaCommand(int IdArea) : IRequest<Response<bool>>;
