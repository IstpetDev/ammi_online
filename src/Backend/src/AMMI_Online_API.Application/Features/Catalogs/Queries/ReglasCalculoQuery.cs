using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetReglasCalculoByIdQuery(int Id) : IRequest<Response<ReglasCalculoDTO>>;
public record GetReglasCalculoByPlantillaEstructuraQuery(int IdPlantillaEstructura) : IRequest<Response<ReglasCalculoDTO>>;
public record GetReglasCalculoByPlantillaEvaluacionQuery(int IdPlantillaEvaluacion) : IRequest<Response<IEnumerable<ReglasCalculoDTO>>>;
