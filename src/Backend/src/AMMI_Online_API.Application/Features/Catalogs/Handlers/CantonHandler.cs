using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllCantonQueryHandler : IRequestHandler<GetAllCantonQuery, Response<IEnumerable<CantonDTO>>>
{
    private readonly ICantonRepository _repository;

    public GetAllCantonQueryHandler(ICantonRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<CantonDTO>>> Handle(GetAllCantonQuery request, CancellationToken cancellationToken)
    {
        var cantones = await _repository.GetAllAsync(cancellationToken);

        var dtos = cantones.Select(c => new CantonDTO
        {
            IdCanton = c.IdCanton,
            Nombre = c.Nombre,
            IdProvincia = c.IdProvincia
        });

        return new Response<IEnumerable<CantonDTO>>(dtos);
    }
}

public class GetCantonesByProvinciaQueryHandler : IRequestHandler<GetCantonesByProvinciaQuery, Response<IEnumerable<CantonDTO>>>
{
    private readonly ICantonRepository _repository;

    public GetCantonesByProvinciaQueryHandler(ICantonRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<CantonDTO>>> Handle(GetCantonesByProvinciaQuery request, CancellationToken cancellationToken)
    {
        var cantones = await _repository.GetByProvinciaAsync(request.IdProvincia, cancellationToken);

        var dtos = cantones.Select(c => new CantonDTO
        {
            IdCanton = c.IdCanton,
            Nombre = c.Nombre,
            IdProvincia = c.IdProvincia
        });

        return new Response<IEnumerable<CantonDTO>>(dtos);
    }
}

public class CreateCantonCommandHandler : IRequestHandler<CreateCantonCommand, Response<int>>
{
    private readonly ICantonRepository _repository;

    public CreateCantonCommandHandler(ICantonRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateCantonCommand request, CancellationToken cancellationToken)
    {
        var canton = new Canton
        {
            Nombre = request.cantonDTO.Nombre,
            IdProvincia = request.cantonDTO.IdProvincia
        };

        var created = await _repository.AddAsync(canton, cancellationToken);

        return Response<int>.Success(created.IdCanton, "Cantón creado correctamente");
    }
}

public class UpdateCantonCommandHandler : IRequestHandler<UpdateCantonCommand, Response<bool>>
{
    private readonly ICantonRepository _repository;

    public UpdateCantonCommandHandler(ICantonRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateCantonCommand request, CancellationToken cancellationToken)
    {
        var canton = await _repository.GetByIdAsync(request.cantonDTO.IdCanton, cancellationToken);

        if (canton == null)
            return Response<bool>.Failure("El cantón no existe");

        canton.Nombre = request.cantonDTO.Nombre;
        canton.IdProvincia = request.cantonDTO.IdProvincia;

        await _repository.UpdateAsync(canton, cancellationToken);

        return Response<bool>.Success(true, "Cantón actualizado correctamente");
    }
}

public class DeleteCantonCommandHandler : IRequestHandler<DeleteCantonCommand, Response<bool>>
{
    private readonly ICantonRepository _repository;

    public DeleteCantonCommandHandler(ICantonRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteCantonCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdCanton, cancellationToken))
            return Response<bool>.Failure("El cantón no existe");

        var deleted = await _repository.DeleteAsync(request.IdCanton, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Cantón eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el cantón");
    }
}
