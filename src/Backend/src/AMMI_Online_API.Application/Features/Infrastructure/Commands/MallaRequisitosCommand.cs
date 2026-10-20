using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Commands;

/// <summary>
/// Comando para crear una relacion Malla-Requisito individual
/// </summary>
public record CreateMallaRequisitosCommand(MallaRequisitosCreateDTO CreateDto) : IRequest<MallaRequisitosDTO>;

/// <summary>
/// Comando para asignar multiples requisitos a una malla (agrega sin eliminar existentes)
/// </summary>
public record AsignarRequisitosAMallaCommand(AsignarRequisitosAMallaDTO AsignarDto) : IRequest<IEnumerable<MallaRequisitosDTO>>;

/// <summary>
/// Comando para reemplazar todos los requisitos de una malla (elimina existentes y agrega nuevos)
/// </summary>
public record ReemplazarRequisitosCommand(ReemplazarRequisitosDTO ReemplazarDto) : IRequest<IEnumerable<MallaRequisitosDTO>>;

/// <summary>
/// Comando para eliminar una relacion por su ID
/// </summary>
public record DeleteMallaRequisitosCommand(int Id) : IRequest<bool>;

/// <summary>
/// Comando para eliminar todas las relaciones de una malla
/// </summary>
public record DeleteRequisitosDemallaCommand(int IdMalla) : IRequest<bool>;
