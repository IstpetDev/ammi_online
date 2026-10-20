using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAreaHandler : IRequestHandler<GetAreaQuery, Response<IEnumerable<AreaDTO>>>
{
    private readonly IArea _repository;
    public GetAreaHandler(IArea repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<AreaDTO>>> Handle(GetAreaQuery request, CancellationToken cancellationToken)
    {
        var areas = await _repository.FindAsync(
            request.IdArea,
            request.Detalle,
            cancellationToken);
        if (!areas.Any())
            return Response<IEnumerable<AreaDTO>>.Failure("No se encontraron resultados");
        var result = areas.Select(c => new AreaDTO
        {
            IdArea = c.IdArea,
            Detalle = c.Detalle
        });
        return Response<IEnumerable<AreaDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateAreaHandler : IRequestHandler<CreateAreaCommand, Response<int>>
{
    private readonly IArea _repository;
    public CreateAreaHandler(IArea repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreateAreaCommand request, CancellationToken cancellationToken)
    {
        var entity = new Area
        {
            Detalle = request.Detalle
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdArea, "Area creada exitosamente");
    }
}

public class UpdateAreaHandler : IRequestHandler<UpdateAreaCommand, Response<bool>>
{
    private readonly IArea _repository;
    public UpdateAreaHandler(IArea repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(UpdateAreaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdArea, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Area no encontrada");
        entity.Detalle = request.Detalle;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Area actualizada exitosamente");
    }
}

public class DeleteAreaHandler : IRequestHandler<DeleteAreaCommand, Response<bool>>
{
    private readonly IArea _repository;
    public DeleteAreaHandler(IArea repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeleteAreaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdArea, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Area no encontrada");
        await _repository.DeleteAsync(entity.IdArea, cancellationToken);
        return Response<bool>.Success(true, "Area eliminada exitosamente");
    }
}
