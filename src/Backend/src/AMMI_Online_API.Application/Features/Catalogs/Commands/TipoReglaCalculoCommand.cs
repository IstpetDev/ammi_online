using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoReglaCalculoCommand(TipoReglaCalculoCreateDTO TipoReglaCalculo) : IRequest<TipoReglaCalculoDTO>;

public record UpdateTipoReglaCalculoCommand(TipoReglaCalculoUpdateDTO TipoReglaCalculo) : IRequest<TipoReglaCalculoDTO>;

public record DeleteTipoReglaCalculoCommand(int Id) : IRequest<bool>;
