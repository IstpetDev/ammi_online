using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Handlers;

public class GetAllModuloQueryHandler : IRequestHandler<GetAllModuloQuery, Response<IEnumerable<ModuloDTO>>>
{
    private readonly IModuloRepository _repository;

    public GetAllModuloQueryHandler(IModuloRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<ModuloDTO>>> Handle(GetAllModuloQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);

        var dtos = entities.Select(e => new ModuloDTO
        {
            IdModulo = e.IdModulo,
            Detalle = e.Detalle
        });

        return new Response<IEnumerable<ModuloDTO>>(dtos);
    }
}

public class CreateModuloCommandHandler : IRequestHandler<CreateModuloCommand, Response<int>>
{
    private readonly IModuloRepository _repository;

    public CreateModuloCommandHandler(IModuloRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateModuloCommand request, CancellationToken cancellationToken)
    {
        var entity = new Modulo
        {
            Detalle = request.Detalle
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return Response<int>.Success(created.IdModulo, "Módulo creado correctamente");
    }
}

public class UpdateModuloCommandHandler : IRequestHandler<UpdateModuloCommand, Response<bool>>
{
    private readonly IModuloRepository _repository;

    public UpdateModuloCommandHandler(IModuloRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateModuloCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdModulo, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Módulo no encontrado");

        entity.Detalle = request.Detalle;

        await _repository.UpdateAsync(entity, cancellationToken);

        return Response<bool>.Success(true, "Módulo actualizado correctamente");
    }
}

public class DeleteModuloCommandHandler : IRequestHandler<DeleteModuloCommand, Response<bool>>
{
    private readonly IModuloRepository _repository;

    public DeleteModuloCommandHandler(IModuloRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteModuloCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdModulo, cancellationToken))
            return Response<bool>.Failure("Módulo no encontrado");

        var deleted = await _repository.DeleteAsync(request.IdModulo, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Módulo eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el módulo");
    }
}
