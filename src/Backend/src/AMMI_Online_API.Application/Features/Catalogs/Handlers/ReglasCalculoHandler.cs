using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetReglasCalculoHandler : 
    IRequestHandler<GetReglasCalculoByIdQuery, Response<ReglasCalculoDTO>>,
    IRequestHandler<GetReglasCalculoByPlantillaEstructuraQuery, Response<ReglasCalculoDTO>>,
    IRequestHandler<GetReglasCalculoByPlantillaEvaluacionQuery, Response<IEnumerable<ReglasCalculoDTO>>>
{
    private readonly IReglasCalculoRepository _repository;

    public GetReglasCalculoHandler(IReglasCalculoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<ReglasCalculoDTO>> Handle(GetReglasCalculoByIdQuery request, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(request.Id, ct);
        if (entity == null) return Response<ReglasCalculoDTO>.Failure("Regla de calculo no encontrada");
        return Response<ReglasCalculoDTO>.Success(MapToDTO(entity), "Regla encontrada");
    }

    public async Task<Response<ReglasCalculoDTO>> Handle(GetReglasCalculoByPlantillaEstructuraQuery request, CancellationToken ct)
    {
        var entity = await _repository.GetByPlantillaEstructuraAsync(request.IdPlantillaEstructura, ct);
        if (entity == null) return Response<ReglasCalculoDTO>.Failure("No existe regla para esta estructura");
        return Response<ReglasCalculoDTO>.Success(MapToDTO(entity), "Regla encontrada");
    }

    public async Task<Response<IEnumerable<ReglasCalculoDTO>>> Handle(GetReglasCalculoByPlantillaEvaluacionQuery request, CancellationToken ct)
    {
        var entities = await _repository.GetByPlantillaEvaluacionAsync(request.IdPlantillaEvaluacion, ct);
        var dtos = entities.Select(MapToDTO);
        return Response<IEnumerable<ReglasCalculoDTO>>.Success(dtos, "Reglas encontradas");
    }

    private static ReglasCalculoDTO MapToDTO(ReglasCalculo entity) => new()
    {
        IdReglasCalculo = entity.IdReglasCalculo,
        IdTipoReglaCalculo = entity.IdTipoReglaCalculo,
        IdPlantillaEstructura = entity.IdPlantillaEstructura,
        NotaMinimaAprobar = entity.NotaMinimaAprobar,
        NotaMinimaRecuperar = entity.NotaMinimaRecuperar,
        TipoReglaDetalle = entity.IdTipoReglaCalculoNavigation?.Detalle ?? string.Empty,
        NodoNombre = entity.IdPlantillaEstructuraNavigation?.NodoNombre ?? string.Empty
    };
}

public class CreateReglasCalculoHandler : IRequestHandler<CreateReglasCalculoCommand, Response<int>>
{
    private readonly IReglasCalculoRepository _repository;

    public CreateReglasCalculoHandler(IReglasCalculoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateReglasCalculoCommand request, CancellationToken ct)
    {
        // Check if exists
        var existing = await _repository.GetByPlantillaEstructuraAsync(request.IdPlantillaEstructura, ct);
        if (existing != null)
            return Response<int>.Failure("Ya existe una regla para este nodo de estructura");

        var entity = new ReglasCalculo
        {
            IdTipoReglaCalculo = request.IdTipoReglaCalculo,
            IdPlantillaEstructura = request.IdPlantillaEstructura,
            NotaMinimaAprobar = request.NotaMinimaAprobar,
            NotaMinimaRecuperar = request.NotaMinimaRecuperar
        };

        await _repository.AddAsync(entity, ct);
        return Response<int>.Success(entity.IdReglasCalculo, "Regla creada exitosamente");
    }
}

public class UpdateReglasCalculoHandler : IRequestHandler<UpdateReglasCalculoCommand, Response<bool>>
{
    private readonly IReglasCalculoRepository _repository;

    public UpdateReglasCalculoHandler(IReglasCalculoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateReglasCalculoCommand request, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(request.IdReglasCalculo, ct);
        if (entity == null) return Response<bool>.Failure("Regla no encontrada");

        entity.IdTipoReglaCalculo = request.IdTipoReglaCalculo;
        entity.NotaMinimaAprobar = request.NotaMinimaAprobar;
        entity.NotaMinimaRecuperar = request.NotaMinimaRecuperar;

        await _repository.UpdateAsync(entity, ct);
        return Response<bool>.Success(true, "Regla actualizada exitosamente");
    }
}

public class DeleteReglasCalculoHandler : IRequestHandler<DeleteReglasCalculoCommand, Response<bool>>
{
    private readonly IReglasCalculoRepository _repository;

    public DeleteReglasCalculoHandler(IReglasCalculoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteReglasCalculoCommand request, CancellationToken ct)
    {
        await _repository.DeleteAsync(request.IdReglasCalculo, ct);
        return Response<bool>.Success(true, "Regla eliminada exitosamente");
    }
}
