using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetInstitucionHandler : IRequestHandler<GetInstitucionQuery, Response<IEnumerable<InstitucionDTO>>>
{
    private readonly IInstitucion _repository;
    public GetInstitucionHandler(IInstitucion repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<InstitucionDTO>>> Handle(GetInstitucionQuery query, CancellationToken cancellationToken)
    {
        var instituciones = await _repository.FindAsync(
            query.IdInstitucion,
            query.Detalle,
            query.RepresentanteLegal,
            query.Ruc,
            query.IdAdjunto,
            cancellationToken);
        if (!instituciones.Any())
            return Response<IEnumerable<InstitucionDTO>>.Failure("No se encontraron resultados");
        var result = instituciones.Select(i => new InstitucionDTO
        {
            IdInstitucion = i.IdInstitucion,
            Detalle = i.Detalle,
            RepresentanteLegal = i.RepresentanteLegal,
            Ruc = i.Ruc,
            IdAdjunto = i.IdAdjunto
        });
        return Response<IEnumerable<InstitucionDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateInstitucionHandler : IRequestHandler<CreateInstitucionCommand, Response<int>>
{
    private readonly IInstitucion _repository;
    public CreateInstitucionHandler(IInstitucion repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreateInstitucionCommand request, CancellationToken cancellationToken)
    {
        var entity = new Institucion
        {
            Detalle = request.Detalle,
            RepresentanteLegal = request.RepresentanteLegal,
            Ruc = request.Ruc,
            IdAdjunto = request.IdAdjunto
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdInstitucion, "Institución creada exitosamente");
    }
}

public class UpdateInstitucionHandler : IRequestHandler<UpdateInstitucionCommand, Response<bool>>
{
    private readonly IInstitucion _repository;
    public UpdateInstitucionHandler(IInstitucion repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateInstitucionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdInstitucion, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Institución no encontrada");
        entity.Detalle = request.Detalle;
        entity.RepresentanteLegal = request.RepresentanteLegal;
        entity.Ruc = request.Ruc;
        entity.IdAdjunto = request.IdAdjunto;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Institución actualizada exitosamente");
    }
}

public class DeleteInstitucionHandler : IRequestHandler<DeleteInstitucionCommand, Response<bool>>
{
    private readonly IInstitucion _repository;
    public DeleteInstitucionHandler(IInstitucion repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeleteInstitucionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdInstitucion, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Institución no encontrada");
        await _repository.DeleteAsync(entity.IdInstitucion, cancellationToken);
        return Response<bool>.Success(true, "Institución eliminada exitosamente");
    }
}