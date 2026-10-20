using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetMateriaHandler : IRequestHandler<GetMateriaQuery, Response<PaginatedResult<MateriaDTO>>>
{
    private readonly IMateria _repository;
    public GetMateriaHandler(IMateria repository)
    {
        _repository = repository;
    }
    public async Task<Response<PaginatedResult<MateriaDTO>>> Handle(GetMateriaQuery request, CancellationToken cancellationToken)
    {
        var totalCount = await _repository.CountAsync(
            request.IdMateria,
            request.Detalle,
            request.HorasRequeridas,
            request.FechaCreacion,
            request.EsActivo,
            cancellationToken);

        var materias = await _repository.FindAsync(
            request.IdMateria,
            request.Detalle,
            request.HorasRequeridas,
            request.FechaCreacion,
            request.EsActivo,
            request.PageNumber,
            request.PageSize,
            cancellationToken);
            
        var dtos = materias.Select(m => new MateriaDTO
        {
            IdMateria = m.IdMateria,
            Detalle = m.Detalle,
            HorasRequeridas = m.HorasRequeridas,
            FechaCreacion = m.FechaCreacion,
            EsActivo = m.EsActivo
        });
        
        var result = new PaginatedResult<MateriaDTO>(dtos, totalCount, request.PageNumber, request.PageSize);
        
        return Response<PaginatedResult<MateriaDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateMateriaHandler : IRequestHandler<CreateMateriaCommand, Response<int>>
{
    private readonly IMateria _repository;
    public CreateMateriaHandler(IMateria repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreateMateriaCommand request, CancellationToken cancellationToken)
    {
        var entity = new Materia
        {
            Detalle = request.Detalle,
            HorasRequeridas = request.HorasRequeridas,
            FechaCreacion = request.FechaCreacion,
            EsActivo = request.EsActivo
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdMateria, "Materia creada exitosamente");
    }
}

public class UpdateMateriaHandler : IRequestHandler<UpdateMateriaCommand, Response<bool>>
{
    private readonly IMateria _repository;
    public UpdateMateriaHandler(IMateria repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(UpdateMateriaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdMateria, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Materia no encontrada");
        entity.Detalle = request.Detalle;
        entity.HorasRequeridas = request.HorasRequeridas;
        entity.EsActivo = request.EsActivo;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Materia actualizada exitosamente");
    }
}

public class DeleteMateriaHandler : IRequestHandler<DeleteMateriaCommand, Response<bool>>
{
    private readonly IMateria _repository;
    public DeleteMateriaHandler(IMateria repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeleteMateriaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdMateria, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Materia no encontrada");
        entity.EsActivo = false;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Materia eliminada exitosamente");
    }
}