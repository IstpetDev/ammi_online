using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Handlers;

public class GetAllRolOperacionQueryHandler : IRequestHandler<GetAllRolOperacionQuery, Response<IEnumerable<RolOperacionDTO>>>
{
    private readonly IRolOperacionRepository _repository;

    public GetAllRolOperacionQueryHandler(IRolOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<RolOperacionDTO>>> Handle(GetAllRolOperacionQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);

        var dtos = entities.Select(e => new RolOperacionDTO
        {
            IdRolOperacion = e.IdRolOperacion,
            IdModuloOperacion = e.IdModuloOperacion,
            IdRol = e.IdRol,
            EsActivo = e.EsActivo,
            FechaCreacion = e.FechaCreacion
        });

        return new Response<IEnumerable<RolOperacionDTO>>(dtos);
    }
}

public class GetRolOperacionByRolQueryHandler : IRequestHandler<GetRolOperacionByRolQuery, Response<IEnumerable<RolOperacionDTO>>>
{
    private readonly IRolOperacionRepository _repository;

    public GetRolOperacionByRolQueryHandler(IRolOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<RolOperacionDTO>>> Handle(GetRolOperacionByRolQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByRolAsync(request.IdRol, cancellationToken);

        var dtos = entities.Select(e => new RolOperacionDTO
        {
            IdRolOperacion = e.IdRolOperacion,
            IdModuloOperacion = e.IdModuloOperacion,
            IdRol = e.IdRol,
            EsActivo = e.EsActivo,
            FechaCreacion = e.FechaCreacion
        });

        return new Response<IEnumerable<RolOperacionDTO>>(dtos);
    }
}

public class GetRolOperacionByModuloOperacionQueryHandler : IRequestHandler<GetRolOperacionByModuloOperacionQuery, Response<IEnumerable<RolOperacionDTO>>>
{
    private readonly IRolOperacionRepository _repository;

    public GetRolOperacionByModuloOperacionQueryHandler(IRolOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<RolOperacionDTO>>> Handle(GetRolOperacionByModuloOperacionQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByModuloOperacionAsync(request.IdModuloOperacion, cancellationToken);

        var dtos = entities.Select(e => new RolOperacionDTO
        {
            IdRolOperacion = e.IdRolOperacion,
            IdModuloOperacion = e.IdModuloOperacion,
            IdRol = e.IdRol,
            EsActivo = e.EsActivo,
            FechaCreacion = e.FechaCreacion
        });

        return new Response<IEnumerable<RolOperacionDTO>>(dtos);
    }
}

public class GetRolOperacionActivosQueryHandler : IRequestHandler<GetRolOperacionActivosQuery, Response<IEnumerable<RolOperacionDTO>>>
{
    private readonly IRolOperacionRepository _repository;

    public GetRolOperacionActivosQueryHandler(IRolOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<RolOperacionDTO>>> Handle(GetRolOperacionActivosQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetActivosAsync(cancellationToken);

        var dtos = entities.Select(e => new RolOperacionDTO
        {
            IdRolOperacion = e.IdRolOperacion,
            IdModuloOperacion = e.IdModuloOperacion,
            IdRol = e.IdRol,
            EsActivo = e.EsActivo,
            FechaCreacion = e.FechaCreacion
        });

        return new Response<IEnumerable<RolOperacionDTO>>(dtos);
    }
}

public class CreateRolOperacionCommandHandler : IRequestHandler<CreateRolOperacionCommand, Response<int>>
{
    private readonly IRolOperacionRepository _repository;

    public CreateRolOperacionCommandHandler(IRolOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateRolOperacionCommand request, CancellationToken cancellationToken)
    {
        var entity = new RolOperacion
        {
            IdModuloOperacion = request.RolOperacion.IdModuloOperacion,
            IdRol = request.RolOperacion.IdRol,
            EsActivo = request.RolOperacion.EsActivo,
            FechaCreacion = DateTime.Now
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return Response<int>.Success(created.IdRolOperacion, "Rol-Operación creado correctamente");
    }
}

public class UpdateRolOperacionCommandHandler : IRequestHandler<UpdateRolOperacionCommand, Response<bool>>
{
    private readonly IRolOperacionRepository _repository;

    public UpdateRolOperacionCommandHandler(IRolOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateRolOperacionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.RolOperacion.IdRolOperacion, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Rol-Operación no encontrado");

        entity.IdModuloOperacion = request.RolOperacion.IdModuloOperacion;
        entity.IdRol = request.RolOperacion.IdRol;
        entity.EsActivo = request.RolOperacion.EsActivo;

        await _repository.UpdateAsync(entity, cancellationToken);

        return Response<bool>.Success(true, "Rol-Operación actualizado correctamente");
    }
}

public class DeleteRolOperacionCommandHandler : IRequestHandler<DeleteRolOperacionCommand, Response<bool>>
{
    private readonly IRolOperacionRepository _repository;

    public DeleteRolOperacionCommandHandler(IRolOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteRolOperacionCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdRolOperacion, cancellationToken))
            return Response<bool>.Failure("Rol-Operación no encontrado");

        var deleted = await _repository.DeleteAsync(request.IdRolOperacion, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Rol-Operación eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el rol-operación");
    }
}
