using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetCicloHandler : IRequestHandler<GetCicloQuery, Response<IEnumerable<CicloDTO>>>
{
    private readonly ICiclo _repository;
    public GetCicloHandler(ICiclo repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<CicloDTO>>> Handle(GetCicloQuery request, CancellationToken cancellationToken)
    {
        var ciclos = await _repository.FindAsync(
            request.IdCiclo,
            request.IdPadre,
            request.IdPeriodo,
            request.IdRegimen,
            request.Detalle,
            request.FechaInicioEstimada,
            request.FechaFinEstimada,
            request.EsActivo,
            cancellationToken);
        if (!ciclos.Any())
            return Response<IEnumerable<CicloDTO>>.Failure("No se encontraron resultados");
        var result = ciclos.Select(c => new CicloDTO
        {
            IdCiclo = c.IdCiclo,
            IdPadre = c.IdPadre,
            IdPeriodo = c.IdPeriodo,
            IdRegimen = c.IdRegimen,
            IdTipoOferta = c.IdTipoOferta,
            Detalle = c.Detalle,
            FechaInicioEstimada = c.FechaInicioEstimada,
            FechaFinEstimada = c.FechaFinEstimada,
            EsActivo = c.EsActivo,
            NombrePeriodo = c.IdPeriodoNavigation?.Detalle,
            NombreRegimen = c.IdRegimenNavigation?.Detalle,
            NombreCicloPadre = c.IdPadreNavigation?.Detalle,
            NombreTipoOferta = c.IdTipoOfertaNavigation?.Detalle,
            CantidadMallas = c.Malla.Count
        });
        return Response<IEnumerable<CicloDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateCicloHandler : IRequestHandler<CreateCicloCommand, Response<int>>
{
    private readonly ICiclo _repository;
    public CreateCicloHandler(ICiclo repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreateCicloCommand request, CancellationToken cancellationToken)
    {
        var entity = new Ciclo
        {
            IdPadre = request.IdPadre,
            IdPeriodo = request.IdPeriodo,
            IdRegimen = request.IdRegimen,
            IdTipoOferta = request.IdTipoOferta,
            Detalle = request.Detalle,
            FechaInicioEstimada = request.FechaInicioEstimada,
            FechaFinEstimada = request.FechaFinEstimada,
            EsActivo = true,
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdCiclo, "Ciclo creado exitosamente");
    }
}

public class UpdateCicloHandler : IRequestHandler<UpdateCicloCommand, Response<bool>>
{
    private readonly ICiclo _repository;
    public UpdateCicloHandler(ICiclo repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(UpdateCicloCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdCiclo, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Ciclo no encontrado");
        entity.IdPadre = request.IdPadre;
        entity.IdPeriodo = request.IdPeriodo;
        entity.IdRegimen = request.IdRegimen;
        entity.IdTipoOferta = request.IdTipoOferta;
        entity.Detalle = request.Detalle;
        entity.FechaInicioEstimada = request.FechaInicioEstimada;
        entity.FechaFinEstimada = request.FechaFinEstimada;
        entity.EsActivo = true;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Ciclo actualizado exitosamente");
    }
}

public class DeactivateCicloHandler : IRequestHandler<DesactivateCicloCommand, Response<bool>>
{
    private readonly ICiclo _repository;
    public DeactivateCicloHandler(ICiclo repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DesactivateCicloCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdCiclo, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Ciclo no encontrado");
        entity.EsActivo = false;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Ciclo desactivado exitosamente");
    }
}

public class DeleteCicloHandler : IRequestHandler<DeleteCicloCommand, Response<bool>>
{
    private readonly ICiclo _repository;
    public DeleteCicloHandler(ICiclo repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeleteCicloCommand request, CancellationToken cancellationToken)
    {
        var deleted = await _repository.DeleteAsync(request.IdCiclo, cancellationToken);
        if (!deleted)
            return Response<bool>.Failure("Ciclo no encontrado");
        return Response<bool>.Success(true, "Ciclo eliminado exitosamente");
    }
}
