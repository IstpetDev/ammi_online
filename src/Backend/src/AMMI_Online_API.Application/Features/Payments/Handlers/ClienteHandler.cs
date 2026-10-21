using AMMI_Online_API.API.Controllers.Payments;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class ClienteHandler :
    IRequestHandler<ClienteQuery, Response<IEnumerable<ClienteDTO>>>,
    IRequestHandler<CreateClienteCommand, Response<int>>,
    IRequestHandler<UpdateClienteCommand, Response<bool>>,
    IRequestHandler<DeleteClienteCommand, Response<bool>>
{
    private readonly IClienteRepository _repository;

    public ClienteHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<ClienteDTO>>> Handle(ClienteQuery request, CancellationToken cancellationToken)
    {
        var clientes = await _repository.GetAllAsync(
            request.IdCliente,
            request.Nombres,
            request.Apellidos,
            request.Correo,
            request.Celular,
            request.Direccion,
            request.Activo,
            cancellationToken);

        var dtos = clientes.Select(c => new ClienteDTO
        {
            IdCliente = c.IdCliente,
            Documento = c.Documento,
            Nombres = c.Nombres,
            Apellidos = c.Apellidos,
            Correo = c.Correo,
            Celular = c.Celular,
            Direccion = c.Direccion,
            Activo = c.Activo
        });

        return Response<IEnumerable<ClienteDTO>>.Success(dtos, "Consulta realizada correctamente");
    }

    public async Task<Response<int>> Handle(CreateClienteCommand request, CancellationToken cancellationToken)
    {
        var entity = new Cliente
        {
            Documento = request.cliente.Documento,
            Nombres = request.cliente.Nombres,
            Apellidos = request.cliente.Apellidos,
            Correo = request.cliente.Correo,
            Celular = request.cliente.Celular,
            Direccion = request.cliente.Direccion,
            Activo = true
        };
        var created = await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(created.IdCliente, "Cliente creado exitosamente");
    }

    public async Task<Response<bool>> Handle(UpdateClienteCommand request, CancellationToken cancellationToken)
    {
        var entity = new Cliente
        {
            IdCliente = request.cliente.IdCliente,
            Documento = request.cliente.Documento,
            Nombres = request.cliente.Nombres,
            Apellidos = request.cliente.Apellidos,
            Correo = request.cliente.Correo,
            Celular = request.cliente.Celular,
            Direccion = request.cliente.Direccion,
            Activo = request.cliente.Activo
        };
        var updated = await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(updated != null, updated != null ? "Cliente actualizado exitosamente" : "Cliente no encontrado");
    }

    public async Task<Response<bool>> Handle(DeleteClienteCommand request, CancellationToken cancellationToken)
    {
        var result = await _repository.DeleteAsync(request.IdCliente, cancellationToken);
        if (!result)
            return Response<bool>.Failure("Cliente no encontrado");
        return Response<bool>.Success(true, "Cliente eliminado exitosamente");
    }
}
