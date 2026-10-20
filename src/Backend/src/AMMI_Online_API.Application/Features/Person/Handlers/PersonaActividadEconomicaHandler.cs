using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class PersonaActividadEconomicaHandler : IRequestHandler<GetByPersonaActividadEconomicaAsync, Response<IEnumerable<PersonaActividadEconomicaDTO>>>
{
    private readonly IPersonaActividadEconomica _repository;
    public PersonaActividadEconomicaHandler(IPersonaActividadEconomica repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<PersonaActividadEconomicaDTO>>> Handle(GetByPersonaActividadEconomicaAsync request, CancellationToken cancellationToken)
    {
        var personaActividades = await _repository.FindAsync(
            request.IdPersonaActividadEconomica,
            request.IdPersona,
            request.IdTipoActividadEconomica,
            request.Valor,
            request.EsPrincipal,
            request.Activo,
            cancellationToken);
        if (!personaActividades.Any())
            return Response<IEnumerable<PersonaActividadEconomicaDTO>>.Failure("No se encontraron actividades económicas de la persona.");
        var result = personaActividades.Select(pa => new PersonaActividadEconomicaDTO
        {
            IdPersonaActividadEconomica = pa.IdPersonaActividadEconomica,
            IdPersona = pa.IdPersona,
            IdTipoActividadEconomica = pa.IdTipoActividadEconomica,
            Valor = pa.Valor,
            EsPrincipal = pa.EsPrincipal,
            Activo = pa.Activo
        });
        return Response<IEnumerable<PersonaActividadEconomicaDTO>>.Success(result, "Consulta realizada correctamente.");
    }
}

public class CreatePersonaActividadEconomicaHandler : IRequestHandler<CreatePersonaActividadEconomicaCommand, Response<int>>
{
    private readonly IPersonaActividadEconomica _repository;
    public CreatePersonaActividadEconomicaHandler(IPersonaActividadEconomica repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreatePersonaActividadEconomicaCommand request, CancellationToken cancellationToken)
    {
        var entity = new PersonaActividadEconomica
        {
            IdPersona = request.IdPersona,
            IdTipoActividadEconomica = request.IdTipoActividadEconomica,
            Valor = request.Valor,
            EsPrincipal = request.EsPrincipal,
            Activo = request.Activo
        };
        var createdEntity = await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(createdEntity.IdPersonaActividadEconomica, "Actividad económica de la persona creada correctamente.");
    }
}

public class UpdatePersonaActividadEconomicaHandler : IRequestHandler<UpdatePersonaActividadEconomicaCommand, Response<bool>>
{
    private readonly IPersonaActividadEconomica _repository;
    public UpdatePersonaActividadEconomicaHandler(IPersonaActividadEconomica repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(UpdatePersonaActividadEconomicaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdPersonaActividadEconomica, cancellationToken);
        if (entity == null)
        {
            return Response<bool>.Failure("La actividad económica de la persona no existe.");
        }
        entity.IdPersona = request.IdPersona;
        entity.IdTipoActividadEconomica = request.IdTipoActividadEconomica;
        entity.Valor = request.Valor;
        entity.EsPrincipal = request.EsPrincipal;
        entity.Activo = request.Activo;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Actividad económica de la persona actualizada correctamente.");
    }
}

public class DeletePersonaActividadEconomicaHandler : IRequestHandler<DeletePersonaActividadEconomicaCommand, Response<bool>>
{
    private readonly IPersonaActividadEconomica _repository;
    public DeletePersonaActividadEconomicaHandler(IPersonaActividadEconomica repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeletePersonaActividadEconomicaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdPersonaActividadEconomica, cancellationToken);
        if (entity == null)
        {
            return Response<bool>.Failure("La actividad económica de la persona no existe.");
        }
        entity.Activo = false;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Actividad económica de la persona eliminada correctamente.");
    }
}
