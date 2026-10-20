using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetAllRequisitosQuery() : IRequest<IEnumerable<RequisitosDTO>>;

public record GetRequisitosByMallaQuery(int IdMalla) : IRequest<IEnumerable<RequisitosDTO>>;

public record GetRequisitosByTipoOfertaQuery(int IdTipoOferta) : IRequest<IEnumerable<RequisitosDTO>>;

public record GetRequisitosByCursoQuery(int IdCurso) : IRequest<IEnumerable<RequisitosDTO>>;
