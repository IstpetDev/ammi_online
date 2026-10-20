using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class TipoCuentaBancaria :
    IRequestHandler<GetTipoCuentaBancariaQuery, Response<IEnumerable<TipoCuentaDTO>>>,
    IRequestHandler<CreateTipoCuentaBancariaCommand, Response<int>>,
    IRequestHandler<UpdateTipoCuentaBancariaCommand, Response<bool>>,
    IRequestHandler<DeleteTipoCuentaBancariaCommand, Response<bool>>
{
    private readonly ITipoCuentaRepository _repository;

    public TipoCuentaBancaria(ITipoCuentaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<TipoCuentaDTO>>> Handle(GetTipoCuentaBancariaQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetTipoCuenta(request.IdTipoCuenta, request.Detalle, cancellationToken);
        var dtos = entities.Select(e => new TipoCuentaDTO
        {
            IdTipoCuenta = e.IdTipoCuenta,
            Detalle = e.Detalle,
        });
        return new Response<IEnumerable<TipoCuentaDTO>>(dtos);
    }

    public async Task<Response<int>> Handle(CreateTipoCuentaBancariaCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoCuenta
        {
            Detalle = request.TipoCuenta.Detalle,
        };
        var created = await _repository.AddSync(entity, cancellationToken);
        return new Response<int>(created.IdTipoCuenta);
    }

    public async Task<Response<bool>> Handle(UpdateTipoCuentaBancariaCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoCuenta
        {
            IdTipoCuenta = request.TipoCuenta.IdTipoCuenta,
            Detalle = request.TipoCuenta.Detalle,
        };
        var updated = await _repository.UpdateAsync(entity, cancellationToken);
        return new Response<bool>(updated != null);
    }

    public async Task<Response<bool>> Handle(DeleteTipoCuentaBancariaCommand request, CancellationToken cancellationToken)
    {
        var existing = await _repository.GetByIdAsync(request.IdTipoCuenta, cancellationToken);
        if (existing == null)
            return new Response<bool>(false);
        await _repository.DeleteAsync(existing.IdTipoCuenta, cancellationToken);
        return new Response<bool>(true);
    }
}