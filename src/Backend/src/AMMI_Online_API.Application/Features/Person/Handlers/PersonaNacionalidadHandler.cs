using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class GetPersonaNacionalidadHandler: IRequestHandler<GetPersonaNacionalidadQuery, Response<IEnumerable<PersonaNacionalidadDTO>>>
{
    private readonly IPersonaNacionalidad _repository;

    public GetPersonaNacionalidadHandler(IPersonaNacionalidad repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<PersonaNacionalidadDTO>>> Handle(GetPersonaNacionalidadQuery request, CancellationToken cancellationToken)
    {
        var nacionalidades = await _repository.FindAsync(
            request.IdPersonaNacionalidad,
            request.IdPersona,
            request.IdPais,
            request.Nacio,
            cancellationToken);

        if (!nacionalidades.Any())
            return Response<IEnumerable<PersonaNacionalidadDTO>>.Failure("No se encontraron resultados");

        var result = nacionalidades.Select(n => new PersonaNacionalidadDTO
        {
            IdPersonaNacionalidad = n.IdPersonaNacionalidad,
            IdPersona = n.IdPersona,
            IdPais = n.IdPais,
            Nacio = n.Nacio
        });

        return Response<IEnumerable<PersonaNacionalidadDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreatePersonaNacionalidadHandler: IRequestHandler<CreatePersonaNacionalidadCommand, Response<int>>
{
    private readonly IPersonaNacionalidad _repository;

    public CreatePersonaNacionalidadHandler(IPersonaNacionalidad repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreatePersonaNacionalidadCommand request, CancellationToken cancellationToken)
    {
        var entity = new PersonaNacionalidad
        {
            IdPersona = request.IdPersona,
            IdPais = request.IdPais,
            Nacio = request.Nacio
        };

        await _repository.AddAsync(entity, cancellationToken);

        return Response<int>.Success(entity.IdPersonaNacionalidad, "Creado correctamente");
    }
}


public class UpdatePersonaNacionalidadHandler: IRequestHandler<UpdatePersonaNacionalidadCommand, Response<bool>>
{
    private readonly IPersonaNacionalidad _repository;

    public UpdatePersonaNacionalidadHandler(IPersonaNacionalidad repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdatePersonaNacionalidadCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdPersonaNacionalidad, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Registro no encontrado");

        entity.IdPersona = request.IdPersona;
        entity.IdPais = request.IdPais;
        entity.Nacio = request.Nacio;

        await _repository.UpdateAsync(entity, cancellationToken);

        return Response<bool>.Success(true, "Actualizado correctamente");
    }
}


public class DeletePersonaNacionalidadHandler : IRequestHandler<DeletePersonaNacionalidadCommand, Response<bool>>
{
    private readonly IPersonaNacionalidad _repository;
    public DeletePersonaNacionalidadHandler(IPersonaNacionalidad repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeletePersonaNacionalidadCommand request, CancellationToken cancellationToken)
    {
        var nacionalidadExistente = await _repository.GetByIdAsync(request.IdPersonaNacionalidad, cancellationToken);
        if (nacionalidadExistente == null)
        {
            return Response<bool>.Failure("Nacionalidad de la persona no encontrada");
        }
        await _repository.DeleteAsync(request.IdPersonaNacionalidad, cancellationToken);
        return Response<bool>.Success(true, "Nacionalidad de la persona eliminada correctamente");
    }
}
