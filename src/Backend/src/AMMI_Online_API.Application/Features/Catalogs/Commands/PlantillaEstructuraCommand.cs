using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Domain.Entities;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreatePlantillaEstructuraCommand(PlantillaEstructuraCreateDTO CreateDto) : IRequest<PlantillaEstructuraDTO>;
public record CreateEstructuraCompletaCommand(CrearEstructuraCompletaDTO Dto) : IRequest<bool>;
public record UpdatePlantillaEstructuraCommand(int Id, PlantillaEstructuraUpdateDTO UpdateDto) : IRequest<PlantillaEstructuraDTO>;
public record DeletePlantillaEstructuraCommand(int Id) : IRequest<bool>;
public record ReordenarNodosCommand(List<int> IdsOrdenados) : IRequest<bool>;
public record DuplicarPlantillaCommand(int IdOriginal, string NuevoNombre) : IRequest<PlantillaEvaluacion>;
