using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class GetPersonaDireccionHandler : IRequestHandler<GetByPersonaDireccionAsync, Response<IEnumerable<PersonaDireccionDTO>>>
{
    private readonly IPersonaDireccion _repository;
    public GetPersonaDireccionHandler(IPersonaDireccion repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<PersonaDireccionDTO>>> Handle(GetByPersonaDireccionAsync request, CancellationToken cancellationToken)
    {
        var personaDirecciones = await _repository.FindAsync(
            request.IdPersonaDireccion,
            request.IdPersona,
            request.IdParroquia,
            request.DireccionDomiciliaria,
            request.Activo,
            cancellationToken);
        if (!personaDirecciones.Any())
            return Response<IEnumerable<PersonaDireccionDTO>>.Failure("No se encontraron direcciones de la persona.");
        var result = personaDirecciones.Select(pd => new PersonaDireccionDTO
        {
            IdPersonaDireccion = pd.IdPersonaDireccion,
            IdPersona = pd.IdPersona,
            IdParroquia = pd.IdParroquia,
            DireccionDomiciliaria = pd.DireccionDomiciliaria,
            Activo = pd.Activo
        });
        return Response<IEnumerable<PersonaDireccionDTO>>.Success(result, "Consulta realizada correctamente.");
    }
}

public class CreatePersonaDireccionHandler : IRequestHandler<CreatePersonaDireccionCommand, Response<int>>
{
    private readonly IPersonaDireccion _repository;
    public CreatePersonaDireccionHandler(IPersonaDireccion repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreatePersonaDireccionCommand request, CancellationToken cancellationToken)
    {
        var entity = new PersonaDireccion
        {
            IdPersona = request.IdPersona,
            IdParroquia = request.IdParroquia,
            DireccionDomiciliaria = request.DireccionDomiciliaria,
            Activo = request.Activo
        };
        var createdEntity = await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(createdEntity.IdPersonaDireccion, "Dirección de la persona creada correctamente.");
    }
}

public class UpdatePersonaDireccionHandler : IRequestHandler<UpdatePersonaDireccionCommand, Response<bool>>
{
    private readonly IPersonaDireccion _repository;
    public UpdatePersonaDireccionHandler(IPersonaDireccion repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdatePersonaDireccionCommand request, CancellationToken cancellationToken)
    {
        var existingEntity = await _repository.GetByIdAsync(request.IdPersonaDireccion, cancellationToken);
        if (existingEntity == null)
        {
            return Response<bool>.Failure("La dirección de la persona no existe.");
        }
        existingEntity.IdParroquia = request.IdParroquia;
        existingEntity.DireccionDomiciliaria = request.DireccionDomiciliaria;
        existingEntity.Activo = request.Activo;
        await _repository.UpdateAsync(existingEntity, cancellationToken);
        return Response<bool>.Success(true, "Dirección de la persona actualizada correctamente.");
    }
}

public class DeletePersonaDireccionHandler : IRequestHandler<DeletePersonaDireccionCommand, Response<bool>>
{
    private readonly IPersonaDireccion _repository;
    public DeletePersonaDireccionHandler(IPersonaDireccion repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeletePersonaDireccionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdPersonaDireccion, cancellationToken);
        if (entity == null)
        {
            return Response<bool>.Failure("La dirección de la persona no existe.");
        }
        entity.Activo = false;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Dirección de la persona eliminada correctamente.");
    }
}