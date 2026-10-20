using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllTipoPagoQueryHandler : IRequestHandler<GetAllTipoPagoQuery, Response<IEnumerable<TipoPagoDTO>>>
{
    private readonly ITipoPagoRepository _repository;

    public GetAllTipoPagoQueryHandler(ITipoPagoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<TipoPagoDTO>>> Handle(GetAllTipoPagoQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);

        var dtos = entities.Select(e => new TipoPagoDTO
        {
            IdTipoPago = e.IdTipoPago,
            Detalle = e.Detalle
        });

        return new Response<IEnumerable<TipoPagoDTO>>(dtos);
    }
}

public class CreateTipoPagoCommandHandler : IRequestHandler<CreateTipoPagoCommand, Response<int>>
{
    private readonly ITipoPagoRepository _repository;

    public CreateTipoPagoCommandHandler(ITipoPagoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateTipoPagoCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoPago
        {
            Detalle = request.Detalle
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return Response<int>.Success(created.IdTipoPago, "Tipo de pago creado correctamente");
    }
}

public class UpdateTipoPagoCommandHandler : IRequestHandler<UpdateTipoPagoCommand, Response<bool>>
{
    private readonly ITipoPagoRepository _repository;

    public UpdateTipoPagoCommandHandler(ITipoPagoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateTipoPagoCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdTipoPago, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Tipo de pago no encontrado");

        entity.Detalle = request.Detalle;

        await _repository.UpdateAsync(entity, cancellationToken);

        return Response<bool>.Success(true, "Tipo de pago actualizado correctamente");
    }
}

public class DeleteTipoPagoCommandHandler : IRequestHandler<DeleteTipoPagoCommand, Response<bool>>
{
    private readonly ITipoPagoRepository _repository;

    public DeleteTipoPagoCommandHandler(ITipoPagoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteTipoPagoCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdTipoPago, cancellationToken))
            return Response<bool>.Failure("Tipo de pago no encontrado");

        var deleted = await _repository.DeleteAsync(request.IdTipoPago, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Tipo de pago eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el tipo de pago");
    }
}
