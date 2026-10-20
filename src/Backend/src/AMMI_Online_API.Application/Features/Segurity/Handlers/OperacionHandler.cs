using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Handlers;

public class GetAllOperacionQueryHandler : IRequestHandler<GetAllOperacionQuery, Response<IEnumerable<OperacionDTO>>>
{
    private readonly IOperacionRepository _repository;

    public GetAllOperacionQueryHandler(IOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<OperacionDTO>>> Handle(GetAllOperacionQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);

        var dtos = entities.Select(e => new OperacionDTO
        {
            IdOperacion = e.IdOperacion,
            Detalle = e.Detalle
        });

        return new Response<IEnumerable<OperacionDTO>>(dtos);
    }
}

public class CreateOperacionCommandHandler : IRequestHandler<CreateOperacionCommand, Response<int>>
{
    private readonly IOperacionRepository _repository;

    public CreateOperacionCommandHandler(IOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateOperacionCommand request, CancellationToken cancellationToken)
    {
        var entity = new Operacion
        {
            Detalle = request.Detalle
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return Response<int>.Success(created.IdOperacion, "Operación creada correctamente");
    }
}

public class UpdateOperacionCommandHandler : IRequestHandler<UpdateOperacionCommand, Response<bool>>
{
    private readonly IOperacionRepository _repository;

    public UpdateOperacionCommandHandler(IOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateOperacionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdOperacion, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Operación no encontrada");

        entity.Detalle = request.Detalle;

        await _repository.UpdateAsync(entity, cancellationToken);

        return Response<bool>.Success(true, "Operación actualizada correctamente");
    }
}

public class DeleteOperacionCommandHandler : IRequestHandler<DeleteOperacionCommand, Response<bool>>
{
    private readonly IOperacionRepository _repository;

    public DeleteOperacionCommandHandler(IOperacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteOperacionCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdOperacion, cancellationToken))
            return Response<bool>.Failure("Operación no encontrada");

        var deleted = await _repository.DeleteAsync(request.IdOperacion, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Operación eliminada correctamente")
            : Response<bool>.Failure("No se pudo eliminar la operación");
    }
}
