using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries; // Namespace adjusted to Catalogs

public record GetPlantillaEstructuraArbolQuery(int IdPlantilla) : IRequest<List<PlantillaEstructuraDTO>>;
public record GetPlantillaEstructuraNodosQuery(int IdPlantilla) : IRequest<IEnumerable<PlantillaEstructuraDTO>>;
public record GetPlantillaEstructuraByIdQuery(int Id) : IRequest<PlantillaEstructuraDTO>;
public record GetValidacionPesosQuery(int IdPlantilla) : IRequest<ValidacionPesosDTO>;
