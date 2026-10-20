using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Queries;

public record GetMatriculasQuery(int PageNumber = 1, int PageSize = 10) : IRequest<Response<PaginatedResult<MatriculaDTO>>>;
public record GetMatriculasDatosFaltantesPersonaQuery : IRequest<Response<IEnumerable<MatriculaFaltantesDTO>>>;
public record GetMatriculasByMallaQuery(int IdMalla, int PageNumber = 1, int PageSize = 10) : IRequest<Response<PaginatedResult<MatriculaDTO>>>;
