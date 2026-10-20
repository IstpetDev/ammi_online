using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Queries;

/// <summary>
/// Query para obtener una relacion por su ID
/// </summary>
public record GetMallaRequisitosByIdQuery(int Id) : IRequest<MallaRequisitosDTO?>;

/// <summary>
/// Query para obtener todos los requisitos de una malla
/// </summary>
public record GetRequistosByMallaIdQuery(int IdMalla) : IRequest<IEnumerable<MallaRequisitosDTO>>;

/// <summary>
/// Query para obtener todas las mallas que tienen un requisito especifico
/// </summary>
public record GetMallasByRequisitoIdQuery(int IdRequisito) : IRequest<IEnumerable<MallaRequisitosDTO>>;

/// <summary>
/// Query para obtener todas las relaciones Malla-Requisito
/// </summary>
public record GetAllMallaRequisitosQuery() : IRequest<IEnumerable<MallaRequisitosDTO>>;
