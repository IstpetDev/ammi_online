using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllParroquiaQueryHandler : IRequestHandler<GetAllParroquiaQuery, Response<IEnumerable<ParroquiaDTO>>>
{
    private readonly IParroquiaRepository _repository;

    public GetAllParroquiaQueryHandler(IParroquiaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<ParroquiaDTO>>> Handle(GetAllParroquiaQuery request, CancellationToken cancellationToken)
    {
        var parroquias = await _repository.GetAllAsync(cancellationToken);

        var dtos = parroquias.Select(p => new ParroquiaDTO
        {
            IdParroquia = p.IdParroquia,
            Nombre = p.Nombre,
            IdCanton = p.IdCanton
        });

        return new Response<IEnumerable<ParroquiaDTO>>(dtos);
    }
}

public class GetParroquiasByCantonQueryHandler : IRequestHandler<GetParroquiasByCantonQuery, Response<IEnumerable<ParroquiaDTO>>>
{
    private readonly IParroquiaRepository _repository;

    public GetParroquiasByCantonQueryHandler(IParroquiaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<ParroquiaDTO>>> Handle(GetParroquiasByCantonQuery request, CancellationToken cancellationToken)
    {
        var parroquias = await _repository.GetByCantonAsync(request.IdCanton, cancellationToken);

        var dtos = parroquias.Select(p => new ParroquiaDTO
        {
            IdParroquia = p.IdParroquia,
            Nombre = p.Nombre,
            IdCanton = p.IdCanton
        });

        return new Response<IEnumerable<ParroquiaDTO>>(dtos);
    }
}

public class CreateParroquiaCommandHandler : IRequestHandler<CreateParroquiaCommand, Response<int>>
{
    private readonly IParroquiaRepository _repository;

    public CreateParroquiaCommandHandler(IParroquiaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateParroquiaCommand request, CancellationToken cancellationToken)
    {
        var parroquia = new Parroquia
        {
            Nombre = request.parroquiaDTO.Nombre,
            IdCanton = request.parroquiaDTO.IdCanton
        };

        var created = await _repository.AddAsync(parroquia, cancellationToken);

        return Response<int>.Success(created.IdParroquia, "Parroquia creada correctamente");
    }
}

public class UpdateParroquiaCommandHandler : IRequestHandler<UpdateParroquiaCommand, Response<bool>>
{
    private readonly IParroquiaRepository _repository;

    public UpdateParroquiaCommandHandler(IParroquiaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateParroquiaCommand request, CancellationToken cancellationToken)
    {
        var parroquia = await _repository.GetByIdAsync(request.parroquiaDTO.IdParroquia, cancellationToken);

        if (parroquia == null)
            return Response<bool>.Failure("La parroquia no existe");

        parroquia.Nombre = request.parroquiaDTO.Nombre;
        parroquia.IdCanton = request.parroquiaDTO.IdCanton;

        await _repository.UpdateAsync(parroquia, cancellationToken);

        return Response<bool>.Success(true, "Parroquia actualizada correctamente");
    }
}

public class DeleteParroquiaCommandHandler : IRequestHandler<DeleteParroquiaCommand, Response<bool>>
{
    private readonly IParroquiaRepository _repository;

    public DeleteParroquiaCommandHandler(IParroquiaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteParroquiaCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdParroquia, cancellationToken))
            return Response<bool>.Failure("La parroquia no existe");

        var deleted = await _repository.DeleteAsync(request.IdParroquia, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Parroquia eliminada correctamente")
            : Response<bool>.Failure("No se pudo eliminar la parroquia");
    }
}
