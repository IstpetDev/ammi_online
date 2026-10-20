using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllEstadoCivilQueryHandler : IRequestHandler<GetAllEstadoCivilQuery, Response<IEnumerable<EstadoCivilDTO>>>
{
    private readonly IEstadoCivilRepository _repository;

    public GetAllEstadoCivilQueryHandler(IEstadoCivilRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<EstadoCivilDTO>>> Handle(GetAllEstadoCivilQuery request, CancellationToken cancellationToken)
    {
        var estadosCiviles = await _repository.GetAllAsync(cancellationToken);

        var dtos = estadosCiviles.Select(ec => new EstadoCivilDTO
        {
            IdEstadoCivil = ec.IdEstadoCivil,
            Nombre = ec.Nombre
        });

        return new Response<IEnumerable<EstadoCivilDTO>>(dtos);
    }
}

public class CreateEstadoCivilCommandHandler : IRequestHandler<CreateEstadoCivilCommand, Response<int>>
{
    private readonly IEstadoCivilRepository _repository;

    public CreateEstadoCivilCommandHandler(IEstadoCivilRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateEstadoCivilCommand request, CancellationToken cancellationToken)
    {
        var estadoCivil = new EstadoCivil
        {
            Nombre = request.estadoCivilDTO.Nombre
        };

        var created = await _repository.AddAsync(estadoCivil, cancellationToken);

        return Response<int>.Success(created.IdEstadoCivil, "Estado civil creado correctamente");
    }
}

public class UpdateEstadoCivilCommandHandler : IRequestHandler<UpdateEstadoCivilCommand, Response<bool>>
{
    private readonly IEstadoCivilRepository _repository;

    public UpdateEstadoCivilCommandHandler(IEstadoCivilRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateEstadoCivilCommand request, CancellationToken cancellationToken)
    {
        var estadoCivil = await _repository.GetByIdAsync(request.estadoCivilDTO.IdEstadoCivil, cancellationToken);

        if (estadoCivil == null)
            return Response<bool>.Failure("El estado civil no existe");

        estadoCivil.Nombre = request.estadoCivilDTO.Nombre;

        await _repository.UpdateAsync(estadoCivil, cancellationToken);

        return Response<bool>.Success(true, "Estado civil actualizado correctamente");
    }
}

public class DeleteEstadoCivilCommandHandler : IRequestHandler<DeleteEstadoCivilCommand, Response<bool>>
{
    private readonly IEstadoCivilRepository _repository;

    public DeleteEstadoCivilCommandHandler(IEstadoCivilRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteEstadoCivilCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdEstadoCivil, cancellationToken))
            return Response<bool>.Failure("El estado civil no existe");

        var deleted = await _repository.DeleteAsync(request.IdEstadoCivil, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Estado civil eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el estado civil");
    }
}
