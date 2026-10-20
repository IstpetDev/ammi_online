using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Distributive;
using MediatR;

namespace AMMI_Online_API.Application.Features.Distributivo.Queries;

public record GetDistributivoByIdQuery(int Id) : IRequest<Response<DistributivoDTO>>;
public record GetAllDistributivosQuery() : IRequest<Response<IEnumerable<DistributivoDTO>>>;
public record GetDistributivoByParaleloQuery(int IdParalelo) : IRequest<Response<IEnumerable<DistributivoDTO>>>;
public record GetAsignacionesDocenteQuery(int IdPersona) : IRequest<Response<IEnumerable<AsignacionDocenteDTO>>>;
public record GetDistributivoByMallaQuery(int IdMalla, int PageNumber = 1, int PageSize = 10) : IRequest<Response<PaginatedResult<DistributivoDTO>>>;
public record GetDistributivoByCicloQuery(int IdCiclo, int PageNumber = 1, int PageSize = 10) : IRequest<Response<PaginatedResult<DistributivoDTO>>>;
public record GetCargaDocenteQuery(int IdPersona) : IRequest<Response<CargaDocenteDTO>>;
public record GetDocentesDisponiblesQuery() : IRequest<Response<IEnumerable<DocenteDisponibleDTO>>>;
