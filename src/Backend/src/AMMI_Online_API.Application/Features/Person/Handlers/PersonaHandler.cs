using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class GetPersonaHandler : IRequestHandler<GetByPersonaAsync, Response<IEnumerable<PersonaDTO>>>
{
    private readonly IPersona _repository;
    public GetPersonaHandler(IPersona repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<PersonaDTO>>> Handle(GetByPersonaAsync request, CancellationToken cancellationToken)
    {
        var personas = await _repository.FindAsync(
            request.IdPersona,
            request.IdTipoDocumento,
            request.Documento,
            request.IdGenero,
            request.PrimerNombre,
            request.SegundoNombre,
            request.PrimerApellido,
            request.SegundoApellido,
            request.Activo,
            cancellationToken);
        if (!personas.Any())
            return Response<IEnumerable<PersonaDTO>>
                .Failure("Persona no Encontrada");
        var result = personas.Select(p => new PersonaDTO
        {
            IdPersona = p.IdPersona,
            IdTipoDocumento = p.IdTipoDocumento,
            Documento = p.Documento,
            IdGenero = p.IdGenero,
            PrimerNombre = p.PrimerNombre,
            SegundoNombre = p.SegundoNombre,
            PrimerApellido = p.PrimerApellido,
            SegundoApellido = p.SegundoApellido,
            Activo = p.Activo
        });
        return Response<IEnumerable<PersonaDTO>>
            .Success(result, "Persona Encontrada");
    }
}

public class CreatePersonaHandler : IRequestHandler<CreatePersonaCommand, Response<int>>
{
    private readonly IPersona _repository;
    public CreatePersonaHandler(IPersona repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreatePersonaCommand request, CancellationToken cancellationToken)
    {
        var entity = new Persona
        {
            IdTipoDocumento = request.IdTipoDocumento,
            Documento = request.Documento,
            IdGenero = request.IdGenero,
            PrimerNombre = request.PrimerNombre,
            SegundoNombre = request.SegundoNombre,
            PrimerApellido = request.PrimerApellido,
            SegundoApellido = request.SegundoApellido,
            Activo = request.Activo
        };
        var createdEntity = await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(createdEntity.IdPersona, "Persona creada correctamente.");
    }
}

public class UpdatePersonaHandler : IRequestHandler<UpdatePersonaCommand, Response<bool>>
{
    private readonly IPersona _repository;
    public UpdatePersonaHandler(IPersona repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(UpdatePersonaCommand request, CancellationToken cancellationToken)
    {
        var existingEntity = await _repository.GetByIdAsync(request.IdPersona, cancellationToken);
        if (existingEntity == null)
        {
            return Response<bool>.Failure("Persona no encontrada.");
        }
        existingEntity.IdTipoDocumento = request.IdTipoDocumento;
        existingEntity.Documento = request.Documento;
        existingEntity.IdGenero = request.IdGenero;
        existingEntity.PrimerNombre = request.PrimerNombre;
        existingEntity.SegundoNombre = request.SegundoNombre;
        existingEntity.PrimerApellido = request.PrimerApellido;
        existingEntity.SegundoApellido = request.SegundoApellido;
        existingEntity.Activo = request.Activo;
        await _repository.UpdateAsync(existingEntity, cancellationToken);
        return Response<bool>.Success(true, "Persona actualizada correctamente.");
    }
}


public class DeletePersonaHandler : IRequestHandler<DeletePersonaCommand, Response<bool>>
{
    private readonly IPersona _repository;
    public DeletePersonaHandler(IPersona repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeletePersonaCommand request, CancellationToken cancellationToken)
    {
        var result = await _repository.GetByIdAsync(request.IdPersona, cancellationToken);
        if (result == null)
        {
            return Response<bool>.Failure("Error al eliminar la persona");
        }
        result.Activo = false;
        await _repository.UpdateAsync(result, cancellationToken);
        return Response<bool>.Success(true, "Persona eliminada correctamente");
    }
}