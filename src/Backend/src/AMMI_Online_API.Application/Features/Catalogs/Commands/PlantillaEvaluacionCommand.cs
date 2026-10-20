using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreatePlantillaEvaluacionCommand(PlantillaEvaluacionCreateDTO PlantillaEvaluacion) : IRequest<PlantillaEvaluacionDTO>;

public record UpdatePlantillaEvaluacionCommand(PlantillaEvaluacionUpdateDTO PlantillaEvaluacion) : IRequest<PlantillaEvaluacionDTO>;

public record DeletePlantillaEvaluacionCommand(int Id) : IRequest<bool>;
