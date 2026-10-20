using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Commands;

public record CreateMallaCommand(MallaCreateDTO Malla) : IRequest<MallaDTO>;

public record UpdateMallaCommand(MallaUpdateDTO Malla) : IRequest<MallaDTO>;

public record DeleteMallaCommand(int Id) : IRequest<bool>;
