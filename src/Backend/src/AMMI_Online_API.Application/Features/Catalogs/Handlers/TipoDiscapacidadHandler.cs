using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllTipoDiscapacidadQueryHandler : IRequestHandler<GetAllTipoDiscapacidadQuery, Response<IEnumerable<TipoDiscapacidadDTO>>>
{
    private readonly ITipoDiscapacidadRepository _repository;

    public GetAllTipoDiscapacidadQueryHandler(ITipoDiscapacidadRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<TipoDiscapacidadDTO>>> Handle(GetAllTipoDiscapacidadQuery request, CancellationToken cancellationToken)
    {
        var tiposDiscapacidad = await _repository.GetAllAsync(cancellationToken);

        var dtos = tiposDiscapacidad.Select(td => new TipoDiscapacidadDTO
        {
            IdTipoDiscapacidad = td.IdTipoDiscapacidad,
            Nombre = td.Nombre,
            Recomendaciones = td.Recomendaciones
        });

        return new Response<IEnumerable<TipoDiscapacidadDTO>>(dtos);
    }
}

public class CreateTipoDiscapacidadCommandHandler : IRequestHandler<CreateTipoDiscapacidadCommand, Response<int>>
{
    private readonly ITipoDiscapacidadRepository _repository;

    public CreateTipoDiscapacidadCommandHandler(ITipoDiscapacidadRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateTipoDiscapacidadCommand request, CancellationToken cancellationToken)
    {
        var tipoDiscapacidad = new TipoDiscapacidad
        {
            Nombre = request.tipoDiscapacidadDTO.Nombre,
            Recomendaciones = request.tipoDiscapacidadDTO.Recomendaciones
        };

        var created = await _repository.AddAsync(tipoDiscapacidad, cancellationToken);

        return Response<int>.Success(created.IdTipoDiscapacidad, "Tipo de discapacidad creado correctamente");
    }
}

public class UpdateTipoDiscapacidadCommandHandler : IRequestHandler<UpdateTipoDiscapacidadCommand, Response<bool>>
{
    private readonly ITipoDiscapacidadRepository _repository;

    public UpdateTipoDiscapacidadCommandHandler(ITipoDiscapacidadRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateTipoDiscapacidadCommand request, CancellationToken cancellationToken)
    {
        var tipoDiscapacidad = await _repository.GetByIdAsync(request.tipoDiscapacidadDTO.IdTipoDiscapacidad, cancellationToken);

        if (tipoDiscapacidad == null)
            return Response<bool>.Failure("El tipo de discapacidad no existe");

        tipoDiscapacidad.Nombre = request.tipoDiscapacidadDTO.Nombre;
        tipoDiscapacidad.Recomendaciones = request.tipoDiscapacidadDTO.Recomendaciones;

        await _repository.UpdateAsync(tipoDiscapacidad, cancellationToken);

        return Response<bool>.Success(true, "Tipo de discapacidad actualizado correctamente");
    }
}

public class DeleteTipoDiscapacidadCommandHandler : IRequestHandler<DeleteTipoDiscapacidadCommand, Response<bool>>
{
    private readonly ITipoDiscapacidadRepository _repository;

    public DeleteTipoDiscapacidadCommandHandler(ITipoDiscapacidadRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteTipoDiscapacidadCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdTipoDiscapacidad, cancellationToken))
            return Response<bool>.Failure("El tipo de discapacidad no existe");

        var deleted = await _repository.DeleteAsync(request.IdTipoDiscapacidad, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Tipo de discapacidad eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el tipo de discapacidad");
    }
}
