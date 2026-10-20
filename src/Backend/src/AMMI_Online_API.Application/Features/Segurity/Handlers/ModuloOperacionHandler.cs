using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Handlers;

public class GetAllModuloOperacionQueryHandler : IRequestHandler<GetAllModuloOperacionQuery, Response<IEnumerable<ModuloOperacionDTO>>>
{
    private readonly IModuloOperacionRepository _repository;

    public GetAllModuloOperacionQueryHandler(IModuloOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<ModuloOperacionDTO>>> Handle(GetAllModuloOperacionQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);

        var dtos = entities.Select(e => new ModuloOperacionDTO
        {
            IdModuloOperacion = e.IdModuloOperacion,
            IdModulo = e.IdModulo,
            IdOperacion = e.IdOperacion,
            EsActivo = e.EsActivo,
            FechaCreacion = e.FechaCreacion
        });

        return new Response<IEnumerable<ModuloOperacionDTO>>(dtos);
    }
}

public class GetModuloOperacionByModuloQueryHandler : IRequestHandler<GetModuloOperacionByModuloQuery, Response<IEnumerable<ModuloOperacionDTO>>>
{
    private readonly IModuloOperacionRepository _repository;

    public GetModuloOperacionByModuloQueryHandler(IModuloOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<ModuloOperacionDTO>>> Handle(GetModuloOperacionByModuloQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByModuloAsync(request.IdModulo, cancellationToken);

        var dtos = entities.Select(e => new ModuloOperacionDTO
        {
            IdModuloOperacion = e.IdModuloOperacion,
            IdModulo = e.IdModulo,
            IdOperacion = e.IdOperacion,
            EsActivo = e.EsActivo,
            FechaCreacion = e.FechaCreacion
        });

        return new Response<IEnumerable<ModuloOperacionDTO>>(dtos);
    }
}

public class GetModuloOperacionByOperacionQueryHandler : IRequestHandler<GetModuloOperacionByOperacionQuery, Response<IEnumerable<ModuloOperacionDTO>>>
{
    private readonly IModuloOperacionRepository _repository;

    public GetModuloOperacionByOperacionQueryHandler(IModuloOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<ModuloOperacionDTO>>> Handle(GetModuloOperacionByOperacionQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByOperacionAsync(request.IdOperacion, cancellationToken);

        var dtos = entities.Select(e => new ModuloOperacionDTO
        {
            IdModuloOperacion = e.IdModuloOperacion,
            IdModulo = e.IdModulo,
            IdOperacion = e.IdOperacion,
            EsActivo = e.EsActivo,
            FechaCreacion = e.FechaCreacion
        });

        return new Response<IEnumerable<ModuloOperacionDTO>>(dtos);
    }
}

public class GetModuloOperacionActivosQueryHandler : IRequestHandler<GetModuloOperacionActivosQuery, Response<IEnumerable<ModuloOperacionDTO>>>
{
    private readonly IModuloOperacionRepository _repository;

    public GetModuloOperacionActivosQueryHandler(IModuloOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<ModuloOperacionDTO>>> Handle(GetModuloOperacionActivosQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetActivosAsync(cancellationToken);

        var dtos = entities.Select(e => new ModuloOperacionDTO
        {
            IdModuloOperacion = e.IdModuloOperacion,
            IdModulo = e.IdModulo,
            IdOperacion = e.IdOperacion,
            EsActivo = e.EsActivo,
            FechaCreacion = e.FechaCreacion
        });

        return new Response<IEnumerable<ModuloOperacionDTO>>(dtos);
    }
}

public class CreateModuloOperacionCommandHandler : IRequestHandler<CreateModuloOperacionCommand, Response<int>>
{
    private readonly IModuloOperacionRepository _repository;

    public CreateModuloOperacionCommandHandler(IModuloOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateModuloOperacionCommand request, CancellationToken cancellationToken)
    {
        var entity = new ModuloOperacion
        {
            IdModulo = request.ModuloOperacion.IdModulo,
            IdOperacion = request.ModuloOperacion.IdOperacion,
            EsActivo = request.ModuloOperacion.EsActivo,
            FechaCreacion = DateTime.Now
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return Response<int>.Success(created.IdModuloOperacion, "Módulo-Operación creado correctamente");
    }
}

public class UpdateModuloOperacionCommandHandler : IRequestHandler<UpdateModuloOperacionCommand, Response<bool>>
{
    private readonly IModuloOperacionRepository _repository;

    public UpdateModuloOperacionCommandHandler(IModuloOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateModuloOperacionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.ModuloOperacion.IdModuloOperacion, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Módulo-Operación no encontrado");

        entity.IdModulo = request.ModuloOperacion.IdModulo;
        entity.IdOperacion = request.ModuloOperacion.IdOperacion;
        entity.EsActivo = request.ModuloOperacion.EsActivo;

        await _repository.UpdateAsync(entity, cancellationToken);

        return Response<bool>.Success(true, "Módulo-Operación actualizado correctamente");
    }
}

public class DeleteModuloOperacionCommandHandler : IRequestHandler<DeleteModuloOperacionCommand, Response<bool>>
{
    private readonly IModuloOperacionRepository _repository;

    public DeleteModuloOperacionCommandHandler(IModuloOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteModuloOperacionCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdModuloOperacion, cancellationToken))
            return Response<bool>.Failure("Módulo-Operación no encontrado");

        var deleted = await _repository.DeleteAsync(request.IdModuloOperacion, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Módulo-Operación eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el módulo-operación");
    }
}
