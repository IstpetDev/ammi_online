using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllTipoDocumentoQueryHandler : IRequestHandler<GetAllTipoDocumentoQuery, Response<IEnumerable<TipoDocumentoDTO>>>
{
    private readonly ITipoDocumentoRepository _repository;

    public GetAllTipoDocumentoQueryHandler(ITipoDocumentoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<TipoDocumentoDTO>>> Handle(GetAllTipoDocumentoQuery request, CancellationToken cancellationToken)
    {
        var tiposDocumento = await _repository.GetAllAsync(cancellationToken);

        var dtos = tiposDocumento.Select(td => new TipoDocumentoDTO
        {
            IdTipoDocumento = td.IdTipoDocumento,
            Nombre = td.Nombre
        });

        return new Response<IEnumerable<TipoDocumentoDTO>>(dtos);
    }
}

public class CreateTipoDocumentoCommandHandler : IRequestHandler<CreateTipoDocumentoCommand, Response<int>>
{
    private readonly ITipoDocumentoRepository _repository;

    public CreateTipoDocumentoCommandHandler(ITipoDocumentoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateTipoDocumentoCommand request, CancellationToken cancellationToken)
    {
        var tipoDocumento = new TipoDocumento
        {
            Nombre = request.tipoDocumentoDTO.Nombre
        };

        var created = await _repository.AddAsync(tipoDocumento, cancellationToken);

        return Response<int>.Success(created.IdTipoDocumento, "Tipo de documento creado correctamente");
    }
}

public class UpdateTipoDocumentoCommandHandler : IRequestHandler<UpdateTipoDocumentoCommand, Response<bool>>
{
    private readonly ITipoDocumentoRepository _repository;

    public UpdateTipoDocumentoCommandHandler(ITipoDocumentoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateTipoDocumentoCommand request, CancellationToken cancellationToken)
    {
        var tipoDocumento = await _repository.GetByIdAsync(request.tipoDocumentoDTO.IdTipoDocumento, cancellationToken);

        if (tipoDocumento == null)
            return Response<bool>.Failure("El tipo de documento no existe");

        tipoDocumento.Nombre = request.tipoDocumentoDTO.Nombre;

        await _repository.UpdateAsync(tipoDocumento, cancellationToken);

        return Response<bool>.Success(true, "Tipo de documento actualizado correctamente");
    }
}

public class DeleteTipoDocumentoCommandHandler : IRequestHandler<DeleteTipoDocumentoCommand, Response<bool>>
{
    private readonly ITipoDocumentoRepository _repository;

    public DeleteTipoDocumentoCommandHandler(ITipoDocumentoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteTipoDocumentoCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdTipoDocumento, cancellationToken))
            return Response<bool>.Failure("El tipo de documento no existe");

        var deleted = await _repository.DeleteAsync(request.IdTipoDocumento, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Tipo de documento eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el tipo de documento");
    }
}
