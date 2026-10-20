using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetAllPlantillasEvaluacionQuery() : IRequest<IEnumerable<PlantillaEvaluacionDTO>>;

public record GetPlantillasEvaluacionActivasQuery() : IRequest<IEnumerable<PlantillaEvaluacionDTO>>;
