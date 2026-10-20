using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Commands;

public record CreateContenidoMallaCommand(ContenidoMallaCreateDTO CreateDto) : IRequest<ContenidoMallaDTO>;
public record UpdateContenidoMallaCommand(int Id, ContenidoMallaUpdateDTO UpdateDto) : IRequest<ContenidoMallaDTO>;
public record DeleteContenidoMallaCommand(int Id) : IRequest<bool>;
