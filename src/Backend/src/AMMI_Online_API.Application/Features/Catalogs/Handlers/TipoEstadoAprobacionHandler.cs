using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllTipoEstadoAprobacionQueryHandler : IRequestHandler<GetAllTipoEstadoAprobacionQuery, Response<IEnumerable<TipoEstadoAprobacionDTO>>>
{
    private readonly ITipoEstadoAprobacionRepository _repository;

    public GetAllTipoEstadoAprobacionQueryHandler(ITipoEstadoAprobacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<TipoEstadoAprobacionDTO>>> Handle(GetAllTipoEstadoAprobacionQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);

        var dtos = entities.Select(e => new TipoEstadoAprobacionDTO
        {
            IdTipoEstadoAprobacion = e.IdTipoEstadoAprobacion,
            Detalle = e.Detalle
        });

        return new Response<IEnumerable<TipoEstadoAprobacionDTO>>(dtos);
    }
}

public class CreateTipoEstadoAprobacionCommandHandler : IRequestHandler<CreateTipoEstadoAprobacionCommand, Response<int>>
{
    private readonly ITipoEstadoAprobacionRepository _repository;

    public CreateTipoEstadoAprobacionCommandHandler(ITipoEstadoAprobacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateTipoEstadoAprobacionCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoEstadoAprobacion
        {
            Detalle = request.Detalle
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return Response<int>.Success(created.IdTipoEstadoAprobacion, "Tipo de estado de aprobación creado correctamente");
    }
}

public class UpdateTipoEstadoAprobacionCommandHandler : IRequestHandler<UpdateTipoEstadoAprobacionCommand, Response<bool>>
{
    private readonly ITipoEstadoAprobacionRepository _repository;

    public UpdateTipoEstadoAprobacionCommandHandler(ITipoEstadoAprobacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateTipoEstadoAprobacionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdTipoEstadoAprobacion, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Tipo de estado de aprobación no encontrado");

        entity.Detalle = request.Detalle;

        await _repository.UpdateAsync(entity, cancellationToken);

        return Response<bool>.Success(true, "Tipo de estado de aprobación actualizado correctamente");
    }
}

public class DeleteTipoEstadoAprobacionCommandHandler : IRequestHandler<DeleteTipoEstadoAprobacionCommand, Response<bool>>
{
    private readonly ITipoEstadoAprobacionRepository _repository;

    public DeleteTipoEstadoAprobacionCommandHandler(ITipoEstadoAprobacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteTipoEstadoAprobacionCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdTipoEstadoAprobacion, cancellationToken))
            return Response<bool>.Failure("Tipo de estado de aprobación no encontrado");

        var deleted = await _repository.DeleteAsync(request.IdTipoEstadoAprobacion, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Tipo de estado de aprobación eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el tipo de estado de aprobación");
    }
}
