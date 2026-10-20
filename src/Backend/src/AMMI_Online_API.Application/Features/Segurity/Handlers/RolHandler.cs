using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Handlers;

public class GetAllRolQueryHandler : IRequestHandler<GetAllRolQuery, Response<IEnumerable<RolDTO>>>
{
    private readonly IRolRepository _repository;

    public GetAllRolQueryHandler(IRolRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<RolDTO>>> Handle(GetAllRolQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);

        var dtos = entities.Select(e => new RolDTO
        {
            IdRol = e.IdRol,
            Detalle = e.Detalle
        });

        return new Response<IEnumerable<RolDTO>>(dtos);
    }
}

public class CreateRolCommandHandler : IRequestHandler<CreateRolCommand, Response<int>>
{
    private readonly IRolRepository _repository;

    public CreateRolCommandHandler(IRolRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateRolCommand request, CancellationToken cancellationToken)
    {
        var entity = new Rol
        {
            Detalle = request.Detalle
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return Response<int>.Success(created.IdRol, "Rol creado correctamente");
    }
}

public class UpdateRolCommandHandler : IRequestHandler<UpdateRolCommand, Response<bool>>
{
    private readonly IRolRepository _repository;

    public UpdateRolCommandHandler(IRolRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateRolCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdRol, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Rol no encontrado");

        entity.Detalle = request.Detalle;

        await _repository.UpdateAsync(entity, cancellationToken);

        return Response<bool>.Success(true, "Rol actualizado correctamente");
    }
}

public class DeleteRolCommandHandler : IRequestHandler<DeleteRolCommand, Response<bool>>
{
    private readonly IRolRepository _repository;

    public DeleteRolCommandHandler(IRolRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteRolCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdRol, cancellationToken))
            return Response<bool>.Failure("Rol no encontrado");

        var deleted = await _repository.DeleteAsync(request.IdRol, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Rol eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el rol");
    }
}
