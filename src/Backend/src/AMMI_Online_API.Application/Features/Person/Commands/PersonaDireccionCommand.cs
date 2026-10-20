using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Commands;

public record CreatePersonaDireccionCommand(
    int IdPersona,
    int IdParroquia,
    string DireccionDomiciliaria,
    bool Activo
    ) : IRequest<Response<int>>;

public record UpdatePersonaDireccionCommand(
    int IdPersonaDireccion,
    int IdParroquia,
    string DireccionDomiciliaria,
    bool Activo
    ) : IRequest<Response<bool>>;
public record DeletePersonaDireccionCommand(int IdPersonaDireccion) : IRequest<Response<bool>>;

