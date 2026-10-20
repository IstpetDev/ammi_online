using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class GetPersonaInfoHandler : IRequestHandler<GetPersonasInfoQuery, Response<IEnumerable<PersonaInfoDTO>>>
{
    private readonly IPersonaInfo _repository;
    public GetPersonaInfoHandler(IPersonaInfo repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<PersonaInfoDTO>>> Handle(GetPersonasInfoQuery request, CancellationToken cancellationToken)
    {
        var personaInfos = await _repository.FindAsync(
            request.IdPersona,
            request.FechaNacimiento,
            request.IdEstadoCivil,
            request.IdNacionalidadEtnica,
            request.IdTipoSangre,
            cancellationToken);
        if (!personaInfos.Any())
            return Response<IEnumerable<PersonaInfoDTO>>
                .Failure("No persona info found.");
        var result = personaInfos.Select(p => new PersonaInfoDTO
        {
            IdPersona = p.IdPersona,
            FechaNacimiento = p.FechaNacimiento,
            IdEstadoCivil = p.IdEstadoCivil,
            IdNacionalidadEtnica = p.IdNacionalidadEtnica,
            IdTipoSangre = p.IdTipoSangre
        });
        return Response<IEnumerable<PersonaInfoDTO>>
            .Success(result, "Query executed successfully.");
    }
}

public class CreatePersonaInfoHandler : IRequestHandler<CreatePersonaInfoCommand, Response<int>>
{
    private readonly IPersonaInfo _repository;
    public CreatePersonaInfoHandler(IPersonaInfo repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreatePersonaInfoCommand request, CancellationToken cancellationToken)
    {
        var entity = new PersonaInfo
        {
            IdPersona = request.IdPersona,
            FechaNacimiento = request.FechaNacimiento,
            IdEstadoCivil = request.IdEstadoCivil,
            IdNacionalidadEtnica = request.IdNacionalidadEtnica,
            IdTipoSangre = request.IdTipoSangre
        };
        var createdEntity = await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(createdEntity.IdPersona, "Informacion Adicional de la Persona creada correctamente.");
    }
}

public class UpdatePersonaInfoHandler : IRequestHandler<UpdatePersonaInfoCommand , Response<bool>>
{
    private readonly IPersonaInfo _repository;
    public UpdatePersonaInfoHandler(IPersonaInfo repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdatePersonaInfoCommand request, CancellationToken cancellationToken)
    {
        var existingEntity = await _repository.GeyByIdAsync(request.IdPersona, cancellationToken);
        if (existingEntity == null)
        {
            return Response<bool>.Failure("Informacion Adicional no encontrada");
        }
        existingEntity.FechaNacimiento = request.FechaNacimiento;
        existingEntity.IdEstadoCivil = request.IdEstadoCivil;
        existingEntity.IdNacionalidadEtnica = request.IdNacionalidadEtnica;
        existingEntity.IdTipoSangre = request.IdTipoSangre;
        await _repository.UpdateAsync(existingEntity, cancellationToken);
        return Response<bool>.Success(true, "Informacion Adicional de la Persona actualizada correctamente.");
    }
}
public class DeletePersonaInfoHandler : IRequestHandler<DeletePersonaInfoCommand, Response<bool>>
{
    private readonly IPersonaInfo _repository;
    public DeletePersonaInfoHandler(IPersonaInfo repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeletePersonaInfoCommand request, CancellationToken cancellationToken)
    {
        var result = await _repository.GeyByIdAsync(request.IdPersona, cancellationToken);
        if (result == null)
        {
            return Response<bool>.Failure("Informacion Adicional no encontrada");
        }
        await _repository.DeleteAsync(request.IdPersona, cancellationToken);
        return Response<bool>.Success(true, "Informacion Adicional de la Persona Eliminado Correctamente");
    }
}
