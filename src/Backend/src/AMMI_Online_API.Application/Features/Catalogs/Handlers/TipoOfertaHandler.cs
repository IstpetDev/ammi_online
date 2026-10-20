using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllTipoOfertaQueryHandler : IRequestHandler<GetAllTipoOfertaQuery, Response<IEnumerable<TipoOfertaDTO>>>
{
    private readonly ITipoOfertaRepository _repository;

    public GetAllTipoOfertaQueryHandler(ITipoOfertaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<TipoOfertaDTO>>> Handle(GetAllTipoOfertaQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);

        var dtos = entities.Select(e => new TipoOfertaDTO
        {
            IdtipoOferta = e.IdTipoOferta,
            Detalle = e.Detalle,
            Duracion = e.Duracion,
            EsActivo = e.EsActivo
        });

        return new Response<IEnumerable<TipoOfertaDTO>>(dtos);
    }
}

public class CreateTipoOfertaCommandHandler : IRequestHandler<CreateTipoOfertaCommand, Response<int>>
{
    private readonly ITipoOfertaRepository _repository;

    public CreateTipoOfertaCommandHandler(ITipoOfertaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateTipoOfertaCommand request, CancellationToken cancellationToken)
    {
        var entity = new TipoOferta
        {
            Detalle = request.Detalle,
            Duracion = request.Duracion,
            EsActivo = request.EsActivo
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return Response<int>.Success(created.IdTipoOferta, "Tipo de oferta creado correctamente");
    }
}

public class UpdateTipoOfertaCommandHandler : IRequestHandler<UpdateTipoOfertaCommand, Response<bool>>
{
    private readonly ITipoOfertaRepository _repository;

    public UpdateTipoOfertaCommandHandler(ITipoOfertaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateTipoOfertaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdtipoOferta, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Tipo de oferta no encontrado");

        entity.Detalle = request.Detalle;
        entity.Duracion = request.Duracion;
        entity.EsActivo = request.EsActivo;

        await _repository.UpdateAsync(entity, cancellationToken);

        return Response<bool>.Success(true, "Tipo de oferta actualizado correctamente");
    }
}

public class DeleteTipoOfertaCommandHandler : IRequestHandler<DeleteTipoOfertaCommand, Response<bool>>
{
    private readonly ITipoOfertaRepository _repository;

    public DeleteTipoOfertaCommandHandler(ITipoOfertaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteTipoOfertaCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdtipoOferta, cancellationToken))
            return Response<bool>.Failure("Tipo de oferta no encontrado");

        var deleted = await _repository.DeleteAsync(request.IdtipoOferta, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Tipo de oferta eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el tipo de oferta");
    }
}
