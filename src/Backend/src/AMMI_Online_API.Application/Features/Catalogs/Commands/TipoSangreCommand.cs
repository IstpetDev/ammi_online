using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoSangreCommand(TipoSangreDTO TipoSangre) : IRequest<TipoSangreDTO>;

public record UpdateTipoSangreCommand(TipoSangreDTO TipoSangre) : IRequest<TipoSangreDTO>;

public record DeleteTipoSangreCommand(int Id) : IRequest<bool>;
