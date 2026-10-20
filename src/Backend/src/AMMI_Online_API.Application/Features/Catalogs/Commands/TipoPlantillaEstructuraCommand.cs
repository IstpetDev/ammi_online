using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoPlantillaEstructuraCommand(TipoPlantillaEstructuraCreateDTO TipoPlantillaEstructura) : IRequest<TipoPlantillaEstructuraDTO>;

public record UpdateTipoPlantillaEstructuraCommand(TipoPlantillaEstructuraUpdateDTO TipoPlantillaEstructura) : IRequest<TipoPlantillaEstructuraDTO>;

public record DeleteTipoPlantillaEstructuraCommand(int Id) : IRequest<bool>;
