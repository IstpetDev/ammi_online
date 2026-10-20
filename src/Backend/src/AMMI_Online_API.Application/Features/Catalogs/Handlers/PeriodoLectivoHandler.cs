using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetPeriodoLectivoHandler : IRequestHandler<GetPeriodolectivoQuery, Response<IEnumerable<PeriodoLectivoDTO>>>
{
    private readonly IPeriodoLectivo _repository;
    public GetPeriodoLectivoHandler(IPeriodoLectivo repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<PeriodoLectivoDTO>>> Handle(GetPeriodolectivoQuery request, CancellationToken cancellationToken)
    {
        var periodos = await _repository.FindAsync(
            request.IdPeriodoLectivo,
            request.Detalle,
            request.FechaInicioEstimada,
            request.FechaFinEstimada,
            cancellationToken);
        if (!periodos.Any())
            return Response<IEnumerable<PeriodoLectivoDTO>>.Failure("No se encontraron resultados");
        var result = periodos.Select(n => new PeriodoLectivoDTO
        {
            IdPeriodoLectivo = n.IdPeriodoLectivo,
            Detalle = n.Detalle,
            FechaInicioEstimada = n.FechaInicioEstimada,
            FechaFinEstimada = n.FechaFinEstimada
        });
        return Response<IEnumerable<PeriodoLectivoDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreatePeriodoLectivoHandler : IRequestHandler<CreatePeriodoLectivoCommand, Response<int>>
{
    private readonly IPeriodoLectivo _repository;
    public CreatePeriodoLectivoHandler(IPeriodoLectivo repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreatePeriodoLectivoCommand request, CancellationToken cancellationToken)
    {
        var entity = new PeriodoLectivo
        {
            Detalle = request.Detalle,
            FechaInicioEstimada = request.FechaInicioEstimada,
            FechaFinEstimada = request.FechaFinEstimada
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdPeriodoLectivo, "Periodo lectivo creado exitosamente");
    }
}

public class UpdatePeriodoLectivoHandler : IRequestHandler<UpdatePeriodoLectivoCommand, Response<bool>>
{
    private readonly IPeriodoLectivo _repository;
    public UpdatePeriodoLectivoHandler(IPeriodoLectivo repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(UpdatePeriodoLectivoCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdPeriodoLectivo, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Periodo lectivo no encontrado");
        entity.Detalle = request.Detalle;
        entity.FechaInicioEstimada = request.FechaInicioEstimada;
        entity.FechaFinEstimada = request.FechaFinEstimada;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Periodo lectivo actualizado exitosamente");
    }
}

public class DeletePeriodoLectivoHandler : IRequestHandler<DeletePeriodoLectivoCommand, Response<bool>>
{
    private readonly IPeriodoLectivo _repository;
    public DeletePeriodoLectivoHandler(IPeriodoLectivo repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeletePeriodoLectivoCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdPeriodoLectivo, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Periodo lectivo no encontrado");
        await _repository.DeleteAsync(entity.IdPeriodoLectivo, cancellationToken);
        return Response<bool>.Success(true, "Periodo lectivo eliminado exitosamente");
    }
}