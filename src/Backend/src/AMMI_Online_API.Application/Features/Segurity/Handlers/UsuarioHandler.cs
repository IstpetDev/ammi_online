using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Handlers;

public class GetAllUsuarioQueryHandler : IRequestHandler<UsuarioQuery, Response<IEnumerable<UsuarioDTO>>>
{
    private readonly IUsuarioRepository _repository;
    public GetAllUsuarioQueryHandler(IUsuarioRepository repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<UsuarioDTO>>> Handle(UsuarioQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);
        var dtos = entities.Select(e => new UsuarioDTO
        {
            Username = e.Username,
            Contrasenia = e.Contrasenia
        });
        return new Response<IEnumerable<UsuarioDTO>>(dtos);
    }
}

public class GetUsuarioByHandler : IRequestHandler<GetUsuarioByIdQuery, UsuarioDTO>
{
    private readonly IUsuarioRepository _repository;
    public GetUsuarioByHandler(IUsuarioRepository repository)
    {
        _repository = repository;
    }
    public async Task<UsuarioDTO> Handle(GetUsuarioByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.id, cancellationToken);
        if (entity == null) return null;
        return new UsuarioDTO
        {
            Username = entity.Username,
            Contrasenia = entity.Contrasenia
        };
    }
}

public class CreateUsuarioCommandHandler : IRequestHandler<CreateUsuarioCommand, Response<int>>
{
    private readonly IUsuarioRepository _repository;
    private readonly IPasswordHasher _passwordHasher;

    public CreateUsuarioCommandHandler(IUsuarioRepository repository, IPasswordHasher passwordHasher)
    {
        _repository = repository;
        _passwordHasher = passwordHasher;
    }

    public async Task<Response<int>> Handle(CreateUsuarioCommand request, CancellationToken cancellationToken)
    {
        var hashedPassword = _passwordHasher.HashPassword(request.Contrasenia);
        var entity = new Usuario
        {
            IdPersona = request.IdPersona,
            Username = request.Username,
            Contrasenia = hashedPassword
        };
        var created = await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(created.IdPersona, "Usuario creado correctamente");
    }
}

public class UpdateUsuarioCommandHandler : IRequestHandler<UpdateUsuarioCommand, Response<bool>>
{
    private readonly IUsuarioRepository _repository;
    private readonly IPasswordHasher _passwordHasher;
    public UpdateUsuarioCommandHandler(IUsuarioRepository repository, IPasswordHasher passwordHasher)
    {
        _repository = repository;
        _passwordHasher = passwordHasher;
    }

    public async Task<Response<bool>> Handle(UpdateUsuarioCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdPersona, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Usuario no encontrado");
        var hashedPassword = _passwordHasher.HashPassword(request.Contrasenia);
        entity.Username = request.Username; 
        entity.Contrasenia = hashedPassword;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Usuario actualizado correctamente");
    }
}

public class DeleteUsuarioCommandHandler : IRequestHandler<DeleteUsuarioCommand, Response<bool>>
{
    private readonly IUsuarioRepository _repository;
    public DeleteUsuarioCommandHandler(IUsuarioRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteUsuarioCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdPersona, cancellationToken))
            return Response<bool>.Failure("Usuario no encontrado");
        var deleted = await _repository.DeleteAsync(request.IdPersona, cancellationToken);

        return deleted != null
            ? Response<bool>.Success(true, "Usuario eliminado correctamente")
            : Response<bool>.Failure("Error al eliminar el usuario");

    }
}