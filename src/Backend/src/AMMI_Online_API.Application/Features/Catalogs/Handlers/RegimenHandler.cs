using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetRegimenHandler : IRequestHandler<GetRegimenQuery, Response<IEnumerable<RegimenDTO>>>
{
    private readonly IRegimen _repository;
    public GetRegimenHandler(IRegimen repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<RegimenDTO>>> Handle(GetRegimenQuery request, CancellationToken cancellationToken)
    {
        var regimenes = await _repository.FindAsync(
            request.IdRegimen,
            request.Detalle,
            cancellationToken);
        if (!regimenes.Any())
            return Response<IEnumerable<RegimenDTO>>.Failure("No se encontraron resultados");
        var result = regimenes.Select(n => new RegimenDTO
        {
            IdRegimen = n.IdRegimen,
            Detalle = n.Detalle
        });
        return Response<IEnumerable<RegimenDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateRegimenHandler : IRequestHandler<CreateRegimenCommand, Response<int>>
{
    private readonly IRegimen _repository;
    public CreateRegimenHandler(IRegimen repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreateRegimenCommand request, CancellationToken cancellationToken)
    {
        var entity = new Regimen
        {
            Detalle = request.Detalle
        };
        await _repository.AddAsync(entity, cancellationToken);
        return Response<int>.Success(entity.IdRegimen, "Régimen creado exitosamente");
    }
}

public class UpdateRegimenHandler : IRequestHandler<UpdateRegimenCommand, Response<bool>>
{
    private readonly IRegimen _repository;

    public UpdateRegimenHandler(IRegimen repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateRegimenCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdRegimen, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Régimen no encontrado");
        entity.Detalle = request.Detalle;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Régimen actualizado");
    }
}

public class DeleteRegimenHandler : IRequestHandler<DeleteRegimenCommand, Response<bool>>
{
    private readonly IRegimen _repository;
    public DeleteRegimenHandler(IRegimen repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeleteRegimenCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdRegimen, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Régimen no encontrado");
        await _repository.DeleteAsync(entity.IdRegimen, cancellationToken);
        return Response<bool>.Success(true, "Régimen eliminado");
    }

}