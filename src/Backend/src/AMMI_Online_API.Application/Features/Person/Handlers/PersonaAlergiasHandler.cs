using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class GetPersonaAlergiasHandler : IRequestHandler<GetByPersonaAlergiasAsync, Response<IEnumerable<PersonaAlergiasDTO>>>
{
    private readonly IPersonaAlergias _repository;
    public GetPersonaAlergiasHandler(IPersonaAlergias repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<PersonaAlergiasDTO>>> Handle(GetByPersonaAlergiasAsync request, CancellationToken cancellationToken)
    {
        var personaAlergias = await _repository.FindAsync(
            request.IdPersonaAlergias,
            request.IdPersona,
            request.IdTipoAlergia,
            request.Detalle,
            cancellationToken);
        if (!personaAlergias.Any())
            return Response<IEnumerable<PersonaAlergiasDTO>>.Failure("No se encontraron resultados");
        var result = personaAlergias.Select(pa => new PersonaAlergiasDTO
        {
            IdPersonaAlergias = pa.IdPersonaAlergias,
            IdPersona = pa.IdPersona,
            IdTipoAlergia = pa.IdTipoAlergia,
            Detalle = pa.Detalle
        });
        return Response<IEnumerable<PersonaAlergiasDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreatePersonaAlergiasHandler : IRequestHandler<CreatePersonaAlergiasCommand, Response<int>>
{
    private readonly IPersonaAlergias _repository;
    public CreatePersonaAlergiasHandler(IPersonaAlergias repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreatePersonaAlergiasCommand request, CancellationToken cancellationToken)
    {
        int createdCount = 0;
        foreach (var item in request.PersonaAlergias)
        {
            var entity = new PersonaAlergias
            {
                IdPersona = item.IdPersona,
                IdTipoAlergia = item.IdTipoAlergia,
                Detalle = item.Detalle
            };
            await _repository.AddAsync(entity, cancellationToken);
            createdCount++;
        }
        return Response<int>.Success(createdCount, $"{createdCount} registros creados exitosamente.");
    }
}


public class UpdatePersonaAlergiasHandler : IRequestHandler<UpdatePersonaAlergiasCommand, Response<bool>>
{
    private readonly IPersonaAlergias _repository;
    public UpdatePersonaAlergiasHandler(IPersonaAlergias repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdatePersonaAlergiasCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdPersonaAlergias, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Registro no encontrado");
        entity.IdPersona = request.IdPersona;
        entity.IdTipoAlergia = request.IdTipoAlergia;
        entity.Detalle = request.Detalle;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Actualizado correctamente");
    }
}

public class DeletePersonaAlergiasHandler : IRequestHandler<DeletePersonaAlergiasCommand, Response<bool>>
{
    private readonly IPersonaAlergias _repository;
    public DeletePersonaAlergiasHandler(IPersonaAlergias repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeletePersonaAlergiasCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdPersonaAlergias, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Registro no encontrado");
        await _repository.DeleteAsync(entity.IdPersonaAlergias, cancellationToken);
        return Response<bool>.Success(true, "Eliminado correctamente");
    }
}

