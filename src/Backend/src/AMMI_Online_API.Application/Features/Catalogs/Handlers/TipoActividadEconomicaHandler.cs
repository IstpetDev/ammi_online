using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllTipoActividadEconomicaQueryHandler : IRequestHandler<GetAllTipoActividadEconomicaQuery, Response<IEnumerable<TipoActividadEconomicaDTO>>>
{
    private readonly ITipoActividadEconomicaRepository _repository;

    public GetAllTipoActividadEconomicaQueryHandler(ITipoActividadEconomicaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<TipoActividadEconomicaDTO>>> Handle(GetAllTipoActividadEconomicaQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);

        var dtos = entities.Select(e => new TipoActividadEconomicaDTO
        {
            IdtipoActividadEconomica = e.IdtipoActividadEconomica,
            Nombre = e.Nombre,
            EsFormal = e.EsFormal
        });

        return new Response<IEnumerable<TipoActividadEconomicaDTO>>(dtos);
    }
}

public class CreateTipoActividadEconomicaCommandHandler : IRequestHandler<CreateTipoActividadEconomicaCommand, Response<int>>
{
    private readonly ITipoActividadEconomicaRepository _repository;

    public CreateTipoActividadEconomicaCommandHandler(ITipoActividadEconomicaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateTipoActividadEconomicaCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoActividadEconomica
        {
            Nombre = request.Nombre,
            EsFormal = request.EsFormal
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return Response<int>.Success(created.IdtipoActividadEconomica, "Tipo de actividad económica creado correctamente");
    }
}

public class UpdateTipoActividadEconomicaCommandHandler : IRequestHandler<UpdateTipoActividadEconomicaCommand, Response<bool>>
{
    private readonly ITipoActividadEconomicaRepository _repository;

    public UpdateTipoActividadEconomicaCommandHandler(ITipoActividadEconomicaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateTipoActividadEconomicaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdtipoActividadEconomica, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Tipo de actividad económica no encontrado");

        entity.Nombre = request.Nombre;
        entity.EsFormal = request.EsFormal;

        await _repository.UpdateAsync(entity, cancellationToken);

        return Response<bool>.Success(true, "Tipo de actividad económica actualizado correctamente");
    }
}

public class DeleteTipoActividadEconomicaCommandHandler : IRequestHandler<DeleteTipoActividadEconomicaCommand, Response<bool>>
{
    private readonly ITipoActividadEconomicaRepository _repository;

    public DeleteTipoActividadEconomicaCommandHandler(ITipoActividadEconomicaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteTipoActividadEconomicaCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdtipoActividadEconomica, cancellationToken))
            return Response<bool>.Failure("Tipo de actividad económica no encontrado");

        var deleted = await _repository.DeleteAsync(request.IdtipoActividadEconomica, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Tipo de actividad económica eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el tipo de actividad económica");
    }
}
