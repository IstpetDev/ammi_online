using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Queries;

public record GetContenidoMallaByIdQuery(int Id) : IRequest<ContenidoMallaDTO>;
public record GetContenidoMallaByDetalleMallaQuery(int IdDetalleMalla) : IRequest<IEnumerable<ContenidoMallaDTO>>;
