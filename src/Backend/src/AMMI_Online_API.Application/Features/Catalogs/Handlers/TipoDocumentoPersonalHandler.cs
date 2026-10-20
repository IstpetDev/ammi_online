using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllTipoDocumentoPersonalQueryHandler : IRequestHandler<GetAllTipoDocumentoPersonalQuery, Response<IEnumerable<TipoDocumentoPersonalDTO>>>
{
    private readonly ITipoDocumentoPersonalRepository _repository;

    public GetAllTipoDocumentoPersonalQueryHandler(ITipoDocumentoPersonalRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<TipoDocumentoPersonalDTO>>> Handle(GetAllTipoDocumentoPersonalQuery request, CancellationToken cancellationToken)
    {
        var tiposDocumentoPersonal = await _repository.GetAllAsync(cancellationToken);

        var dtos = tiposDocumentoPersonal.Select(tdp => new TipoDocumentoPersonalDTO
        {
            IdTipoDocumentoPersonal = tdp.IdTipoDocumentoPersonal,
            Detalle = tdp.Detalle,
        });

        return new Response<IEnumerable<TipoDocumentoPersonalDTO>>(dtos);
    }
}

public class CreateTipoDocumentoPersonalCommandHandler : IRequestHandler<CreateTipoDocumentoPersonalCommand, Response<int>>
{
    private readonly ITipoDocumentoPersonalRepository _repository;

    public CreateTipoDocumentoPersonalCommandHandler(ITipoDocumentoPersonalRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateTipoDocumentoPersonalCommand request, CancellationToken cancellationToken)
    {
        var tipoDocumentoPersonal = new TipoDocumentoPersonal
        {
            Detalle = request.tipoDocumentoPersonalDTO.Detalle,
        };

        var created = await _repository.AddAsync(tipoDocumentoPersonal, cancellationToken);

        return Response<int>.Success(created.IdTipoDocumentoPersonal, "Tipo de documento personal creado correctamente");
    }
}

public class UpdateTipoDocumentoPersonalCommandHandler : IRequestHandler<UpdateTipoDocumentoPersonalCommand, Response<bool>>
{
    private readonly ITipoDocumentoPersonalRepository _repository;

    public UpdateTipoDocumentoPersonalCommandHandler(ITipoDocumentoPersonalRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateTipoDocumentoPersonalCommand request, CancellationToken cancellationToken)
    {
        var tipoDocumentoPersonal = await _repository.GetByIdAsync(request.tipoDocumentoPersonalDTO.IdTipoDocumentoPersonal, cancellationToken);

        if (tipoDocumentoPersonal == null)
            return Response<bool>.Failure("El tipo de documento personal no existe");

        tipoDocumentoPersonal.Detalle = request.tipoDocumentoPersonalDTO.Detalle;

        await _repository.UpdateAsync(tipoDocumentoPersonal, cancellationToken);

        return Response<bool>.Success(true, "Tipo de documento personal actualizado correctamente");
    }
}

public class DeleteTipoDocumentoPersonalCommandHandler : IRequestHandler<DeleteTipoDocumentoPersonalCommand, Response<bool>>
{
    private readonly ITipoDocumentoPersonalRepository _repository;

    public DeleteTipoDocumentoPersonalCommandHandler(ITipoDocumentoPersonalRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteTipoDocumentoPersonalCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdTipoDocumentoPersonal, cancellationToken))
            return Response<bool>.Failure("El tipo de documento personal no existe");

        var deleted = await _repository.DeleteAsync(request.IdTipoDocumentoPersonal, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Tipo de documento personal eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el tipo de documento personal");
    }
}
