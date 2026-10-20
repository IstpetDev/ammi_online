using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateEspecieCommand(EspecieCreateDTO Especie) : IRequest<EspecieDTO>;

public record UpdateEspecieCommand(EspecieUpdateDTO Especie) : IRequest<EspecieDTO>;

public record DeleteEspecieCommand(int Id) : IRequest<bool>;
