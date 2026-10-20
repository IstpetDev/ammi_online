using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateReglasCalculoCommand(int IdTipoReglaCalculo, int IdPlantillaEstructura, decimal? NotaMinimaAprobar, decimal? NotaMinimaRecuperar) : IRequest<Response<int>>;
public record UpdateReglasCalculoCommand(int IdReglasCalculo, int IdTipoReglaCalculo, decimal? NotaMinimaAprobar, decimal? NotaMinimaRecuperar) : IRequest<Response<bool>>;
public record DeleteReglasCalculoCommand(int IdReglasCalculo) : IRequest<Response<bool>>;
