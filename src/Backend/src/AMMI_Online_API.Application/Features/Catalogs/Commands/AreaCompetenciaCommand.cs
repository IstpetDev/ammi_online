using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateAreaCompetenciaCommand(string Detalle, int IdArea) : IRequest<Response<int>>;
public record UpdateAreaCompetenciaCommand(int IdAreaCompetencia, string Detalle, int IdArea) : IRequest<Response<bool>>;
public record DeleteAreaCompetenciaCommand(int IdAreaCompetencia) : IRequest<Response<bool>>;
