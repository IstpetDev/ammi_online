using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class EstadoPagoHandler :
    IRequestHandler<EstadoPagoQuery, Response<IEnumerable<EstadoPagoDTO>>>,
    IRequestHandler<CreateEstadoPagoCommand, Response<int>>,
    IRequestHandler<UpdateEstadoPagoCommand, Response<bool>>,
    IRequestHandler<DeleteEstadoPagoCommand, Response<bool>>
{
    private readonly IEstadoPagoRepository _repository;

    public EstadoPagoHandler(IEstadoPagoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<EstadoPagoDTO>>> Handle(EstadoPagoQuery request, CancellationToken cancellationToken)
    {
        var estadosPago = await _repository.GetAllAsync(
            request.IdEstadoPago,
            request.Detalle,
            request.esCancelado,
            cancellationToken);
        if (!estadosPago.Any())
            return Response<IEnumerable<EstadoPagoDTO>>.Failure("No se encontraron resultados");
        var result = estadosPago.Select(e => new EstadoPagoDTO
        {
            IdEstadoPago = e.IdEstadoPago,
            Detalle = e.Detalle,
            EsCancelado = e.EsCancelado
        });
        return Response<IEnumerable<EstadoPagoDTO>>.Success(result, "Consulta realizada correctamente");
    }

    public async Task<Response<int>> Handle(CreateEstadoPagoCommand request, CancellationToken cancellationToken)
    {
        var entity = new EstadoPago
        {
            Detalle = request.EstadoPago.Detalle,
            EsCancelado = request.EstadoPago.EsCancelado
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdEstadoPago, "Estado de pago creado exitosamente");
    }

    public async Task<Response<bool>> Handle(UpdateEstadoPagoCommand request, CancellationToken cancellationToken)
    {
        var entity = new EstadoPago
        {
            IdEstadoPago = request.EstadoPago.IdEstadoPago,
            Detalle = request.EstadoPago.Detalle,
            EsCancelado = request.EstadoPago.EsCancelado
        };
        var updated = await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Estado de pago actualizado exitosamente");
    }

    public async Task<Response<bool>> Handle(DeleteEstadoPagoCommand request, CancellationToken cancellationToken)
    {
        var deleted = await _repository.DeleteAsync(request.IdEstadoPago, cancellationToken);
        if (!deleted)
            return Response<bool>.Failure("No se encontró el estado de pago a eliminar");
        return Response<bool>.Success(true, "Estado de pago eliminado exitosamente");
    }

}
