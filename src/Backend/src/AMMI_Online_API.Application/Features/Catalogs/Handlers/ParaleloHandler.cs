using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetParaleloHandler : IRequestHandler<GetParaleloQuery, Response<IEnumerable<ParaleloDTO>>>
{
    private readonly IParalelo _repository;
    public GetParaleloHandler(IParalelo repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<ParaleloDTO>>> Handle(GetParaleloQuery request, CancellationToken cancellationToken)
    {
        var paralelos = await _repository.FindAsync(
            request.IdParalelo,
            request.Detalle,
            request.Orden,
            cancellationToken);
        if (!paralelos.Any())
            return Response<IEnumerable<ParaleloDTO>>.Failure("No se encontraron resultados");
        var result = paralelos.Select(n => new ParaleloDTO
        {
            IdParalelo = n.IdParalelo,
            Detalle = n.Detalle,
            Orden = n.Orden
        });
        return Response<IEnumerable<ParaleloDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateParaleloHandler : IRequestHandler<CreateParaleloCommand, Response<int>>
{
    private readonly IParalelo _repository;
    public CreateParaleloHandler(IParalelo repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreateParaleloCommand request, CancellationToken cancellationToken)
    {
        var entity = new Paralelo
        {
            Detalle = request.Detalle,
            Orden = request.Orden
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdParalelo, "Paralelo creado exitosamente");
    }
}

public class UpdateParaleloHandler : IRequestHandler<UpdateParaleloCommand, Response<bool>>
{
    private readonly IParalelo _repository;
    public UpdateParaleloHandler(IParalelo repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(UpdateParaleloCommand request, CancellationToken cancellationToken)
    {
        var exists = await _repository.ExistsAsync(request.IdParalelo, cancellationToken);
        if (!exists)
            return Response<bool>.Failure("El paralelo no existe");
        var entity = new Paralelo
        {
            IdParalelo = request.IdParalelo,
            Detalle = request.Detalle,
            Orden = request.Orden
        };
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Paralelo actualizado exitosamente");
    }
}

public class DeleteParaleloHandler : IRequestHandler<DeleteParaleloCommand, Response<bool>>
{
    private readonly IParalelo _repository;
    public DeleteParaleloHandler(IParalelo repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeleteParaleloCommand request, CancellationToken cancellationToken)
    {
        var exists = await _repository.ExistsAsync(request.IdParalelo, cancellationToken);
        if (!exists)
            return Response<bool>.Failure("El paralelo no existe");
        var deleted = await _repository.DeleteAsync(request.IdParalelo, cancellationToken);
        if (!deleted)
            return Response<bool>.Failure("No se pudo eliminar el paralelo");
        return Response<bool>.Success(true, "Paralelo eliminado exitosamente");
    }
}
