using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Handlers;

public class GetAllRolUsuarioQueryHandler : IRequestHandler<GetAllRolUsuarioQuery, Response<IEnumerable<RolUsuarioDTO>>>
{
    private readonly IRolUsuarioRepository _repository;

    public GetAllRolUsuarioQueryHandler(IRolUsuarioRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<RolUsuarioDTO>>> Handle(GetAllRolUsuarioQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);

        var dtos = entities.Select(e => new RolUsuarioDTO
        {
            IdRolUsuario = e.IdRolUsuario,
            IdRol = e.IdRol,
            IdPersona = e.IdPersona
        });

        return new Response<IEnumerable<RolUsuarioDTO>>(dtos);
    }
}

public class GetRolUsuarioByRolQueryHandler : IRequestHandler<GetRolUsuarioByRolQuery, Response<IEnumerable<RolUsuarioDTO>>>
{
    private readonly IRolUsuarioRepository _repository;

    public GetRolUsuarioByRolQueryHandler(IRolUsuarioRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<RolUsuarioDTO>>> Handle(GetRolUsuarioByRolQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByRolAsync(request.IdRol, cancellationToken);

        var dtos = entities.Select(e => new RolUsuarioDTO
        {
            IdRolUsuario = e.IdRolUsuario,
            IdRol = e.IdRol,
            IdPersona = e.IdPersona
        });

        return new Response<IEnumerable<RolUsuarioDTO>>(dtos);
    }
}

public class GetRolUsuarioByPersonaQueryHandler : IRequestHandler<GetRolUsuarioByPersonaQuery, Response<IEnumerable<RolUsuarioDTO>>>
{
    private readonly IRolUsuarioRepository _repository;

    public GetRolUsuarioByPersonaQueryHandler(IRolUsuarioRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<RolUsuarioDTO>>> Handle(GetRolUsuarioByPersonaQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByPersonaAsync(request.IdPersona, cancellationToken);

        var dtos = entities.Select(e => new RolUsuarioDTO
        {
            IdRolUsuario = e.IdRolUsuario,
            IdRol = e.IdRol,
            IdPersona = e.IdPersona
        });

        return new Response<IEnumerable<RolUsuarioDTO>>(dtos);
    }
}

public class CreateRolUsuarioCommandHandler : IRequestHandler<CreateRolUsuarioCommand, Response<int>>
{
    private readonly IRolUsuarioRepository _repository;

    public CreateRolUsuarioCommandHandler(IRolUsuarioRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateRolUsuarioCommand request, CancellationToken cancellationToken)
    {
        var entity = new RolUsuario
        {
            IdRol = request.RolUsuario.IdRol,
            IdPersona = request.RolUsuario.IdPersona
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return Response<int>.Success(created.IdRolUsuario, "Rol-Usuario creado correctamente");
    }
}

public class UpdateRolUsuarioCommandHandler : IRequestHandler<UpdateRolUsuarioCommand, Response<bool>>
{
    private readonly IRolUsuarioRepository _repository;

    public UpdateRolUsuarioCommandHandler(IRolUsuarioRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateRolUsuarioCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.RolUsuario.IdRolUsuario, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Rol-Usuario no encontrado");

        entity.IdRol = request.RolUsuario.IdRol;
        entity.IdPersona = request.RolUsuario.IdPersona;

        await _repository.UpdateAsync(entity, cancellationToken);

        return Response<bool>.Success(true, "Rol-Usuario actualizado correctamente");
    }
}

public class DeleteRolUsuarioCommandHandler : IRequestHandler<DeleteRolUsuarioCommand, Response<bool>>
{
    private readonly IRolUsuarioRepository _repository;

    public DeleteRolUsuarioCommandHandler(IRolUsuarioRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteRolUsuarioCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdRolUsuario, cancellationToken))
            return Response<bool>.Failure("Rol-Usuario no encontrado");

        var deleted = await _repository.DeleteAsync(request.IdRolUsuario, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Rol-Usuario eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el rol-usuario");
    }
}
