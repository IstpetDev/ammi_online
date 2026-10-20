using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.DTOs;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;


public class GetAllGenerosQueryHandler : IRequestHandler<GetAllGenerosQuery, Response<IEnumerable<GeneroDTO>>>
{
    private readonly IGeneroRepository _repository;

    public GetAllGenerosQueryHandler(IGeneroRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<GeneroDTO>>> Handle(GetAllGenerosQuery request, CancellationToken cancellationToken)
    {
        var generos = await _repository.GetAllAsync(cancellationToken);

        var dtos = generos.Select(g => new GeneroDTO
        {
            IdGenero = g.IdGenero,
            Nombre = g.Nombre
        });

        return new Response<IEnumerable<GeneroDTO>>(dtos);
    }
}
public class CreateGeneroCommandHandler : IRequestHandler<CreateGeneroCommand, Response<GeneroCreateDTO>>
{
    private readonly IGeneroRepository _repository;

    public CreateGeneroCommandHandler(IGeneroRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<GeneroCreateDTO>> Handle(CreateGeneroCommand request, CancellationToken cancellationToken)
    {
        var genero = new Genero
        {
            Nombre = request.Nombre
        };

        var generoCreado = await _repository.AddAsync(genero, cancellationToken);

        var result = new GeneroCreateDTO
        {
            Nombre = generoCreado.Nombre
        };

        return Response<GeneroCreateDTO>.Success(result, "Género creado correctamente");
    }
}

public class UpdateGeneroCommandHandler : IRequestHandler<UpdateGeneroCommand, Response<GeneroUpdateDTO>>
{
    private readonly IGeneroRepository _repository;

    public UpdateGeneroCommandHandler(IGeneroRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<GeneroUpdateDTO>> Handle(UpdateGeneroCommand request, CancellationToken cancellationToken)
    {
        var genero = await _repository.GetByIdAsync(request.IdGenero, cancellationToken);

        if (genero == null)
            throw new InvalidOperationException("El nombre del genero es requerido");

        genero.Nombre = request.Nombre;

        var generoActualizado = await _repository.UpdateAsync(genero, cancellationToken);

        var result = new GeneroUpdateDTO
        {
            IdGenero = generoActualizado.IdGenero,
            Nombre = generoActualizado.Nombre
        };

        return Response<GeneroUpdateDTO>.Success(result, "Género actualizado correctamente");
    }
}

public class DeleteGeneroCommandHandler : IRequestHandler<DeleteGeneroCommand, Response<bool>>
{
    private readonly IGeneroRepository _repository;

    public DeleteGeneroCommandHandler(IGeneroRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteGeneroCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdGenero, cancellationToken))
            throw new InvalidOperationException("El genero no existe");

        var eliminado = await _repository.DeleteAsync(request.IdGenero, cancellationToken);

        return eliminado
            ? Response<bool>.Success(true, "Género eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el género");
    }
}