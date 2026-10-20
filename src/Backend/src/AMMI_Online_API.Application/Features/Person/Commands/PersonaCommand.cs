using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Commands;


public record CreatePersonaCommand(
    int IdTipoDocumento,
    string Documento,
    int IdGenero,
    string PrimerNombre,
    string SegundoNombre,
    string PrimerApellido,
    string SegundoApellido,
    bool Activo
    ) : IRequest<Response<int>>;
public record UpdatePersonaCommand(
    int IdPersona,
    int IdTipoDocumento,
    string Documento,
    int IdGenero,
    string PrimerNombre,
    string SegundoNombre,
    string PrimerApellido,
    string SegundoApellido,
    bool Activo
    ) : IRequest<Response<bool>>;
public record DeletePersonaCommand(int IdPersona) : IRequest<Response<bool>>;
