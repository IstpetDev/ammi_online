using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class CuentaBancariaHandler : 
    IRequestHandler<GetCuentaBancariaQuery, Response<IEnumerable<CuentaBancariaDTO>>>,
    IRequestHandler<CreateCuentaBancariaCommand, Response<int>>,
    IRequestHandler<UpdateCuentaBancariaCommand, Response<bool>>,
    IRequestHandler<DesactivateCuentaBancariaCommand, Response<bool>>
{
    private readonly ICuentaBancariaRepository _repository;

    public CuentaBancariaHandler(ICuentaBancariaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<CuentaBancariaDTO>>> Handle(GetCuentaBancariaQuery request, CancellationToken cancellationToken)
    {
        var cuentas = await _repository.GetAllAsync(
            request.IdCuentaBancaria,
            request.IdTipoCuenta,
            request.NumeroCuenta,
            request.Banco,
            request.Activo,
            cancellationToken);
        if (!cuentas.Any())
            return Response<IEnumerable<CuentaBancariaDTO>>.Failure("No se encontraron resultados");
        var result = cuentas.Select(c => new CuentaBancariaDTO
        {
            IdCuentaBancaria = c.IdCuentaBancaria,
            IdTipoCuenta = c.IdTipoCuenta,
            NumeroCuenta = c.NumeroCuenta,
            Banco = c.Banco,
            Activo = c.Activo
        });
        return Response<IEnumerable<CuentaBancariaDTO>>.Success(result, "Consulta realizada correctamente");
    }

    public async Task<Response<int>> Handle(CreateCuentaBancariaCommand request, CancellationToken cancellationToken)
    {
        var entity = new CuentaBancaria
        {
            IdTipoCuenta = request.cuentaBancaria.IdTipoCuenta,
            NumeroCuenta = request.cuentaBancaria.NumeroCuenta,
            Banco = request.cuentaBancaria.Banco,
            Activo = true,
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdCuentaBancaria, "Cuenta bancaria creada exitosamente");
    }

    public async Task<Response<bool>> Handle(UpdateCuentaBancariaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.cuentaBancaria.IdCuentaBancaria, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Cuenta bancaria no encontrada");
        entity.IdTipoCuenta = request.cuentaBancaria.IdTipoCuenta;
        entity.NumeroCuenta = request.cuentaBancaria.NumeroCuenta;
        entity.Banco = request.cuentaBancaria.Banco;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Cuenta bancaria actualizada exitosamente");
    }

    public async Task<Response<bool>> Handle(DesactivateCuentaBancariaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdCuentaBancaria, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Cuenta bancaria no encontrada");
        entity.Activo = false;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Cuenta bancaria desactivada exitosamente");
    }

}
