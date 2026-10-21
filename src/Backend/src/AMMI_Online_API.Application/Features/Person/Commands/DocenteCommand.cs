using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Commands;

public record CreateDocenteCommand(
    int IdTipoDocumento,
    string Documento,
    int IdGenero,
    string PrimerNombre,
    string? SegundoNombre,
    string PrimerApellido,
    string? SegundoApellido,
    string Email
) : IRequest<Response<int>>;
