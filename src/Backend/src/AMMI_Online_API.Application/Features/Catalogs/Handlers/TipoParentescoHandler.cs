using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllTipoParentescoQueryHandler : IRequestHandler<GetAllTipoParentescoQuery, Response<IEnumerable<TipoParentescoDTO>>>
{
    private readonly ITipoParentescoRepository _repository;

    public GetAllTipoParentescoQueryHandler(ITipoParentescoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<TipoParentescoDTO>>> Handle(GetAllTipoParentescoQuery request, CancellationToken cancellationToken)
    {
        var tiposParentesco = await _repository.GetAllAsync(cancellationToken);

        var dtos = tiposParentesco.Select(tp => new TipoParentescoDTO
        {
            IdTipoParentesco = tp.IdTipoParentesco,
            Detalle = tp.Detalle,
            GradoConsanguinidad = tp.GradoConsanguinidad
        });

        return new Response<IEnumerable<TipoParentescoDTO>>(dtos);
    }
}

public class CreateTipoParentescoCommandHandler : IRequestHandler<CreateTipoParentescoCommand, Response<int>>
{
    private readonly ITipoParentescoRepository _repository;

    public CreateTipoParentescoCommandHandler(ITipoParentescoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateTipoParentescoCommand request, CancellationToken cancellationToken)
    {
        var tipoParentesco = new TipoParentesco
        {
            Detalle = request.tipoParentescoDTO.Detalle,
            GradoConsanguinidad = request.tipoParentescoDTO.GradoConsanguinidad
        };

        var tipoParentescoCreado = await _repository.AddAsync(tipoParentesco, cancellationToken);

        return Response<int>.Success(tipoParentescoCreado.IdTipoParentesco, "Tipo de parentesco creado correctamente");
    }
}

public class UpdateTipoParentescoCommandHandler : IRequestHandler<UpdateTipoParentescoCommand, Response<bool>>
{
    private readonly ITipoParentescoRepository _repository;

    public UpdateTipoParentescoCommandHandler(ITipoParentescoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateTipoParentescoCommand request, CancellationToken cancellationToken)
    {
        var tipoParentesco = await _repository.GetByIdAsync(request.tipoParentescoDTO.IdTipoParentesco, cancellationToken);

        if (tipoParentesco == null)
            return Response<bool>.Failure("El tipo de parentesco no existe");

        tipoParentesco.Detalle = request.tipoParentescoDTO.Detalle;
        tipoParentesco.GradoConsanguinidad = request.tipoParentescoDTO.GradoConsanguinidad;

        await _repository.UpdateAsync(tipoParentesco, cancellationToken);

        return Response<bool>.Success(true, "Tipo de parentesco actualizado correctamente");
    }
}

public class DeleteTipoParentescoCommandHandler : IRequestHandler<DeleteTipoParentescoCommand, Response<bool>>
{
    private readonly ITipoParentescoRepository _repository;

    public DeleteTipoParentescoCommandHandler(ITipoParentescoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteTipoParentescoCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdTipoParentesco, cancellationToken))
            return Response<bool>.Failure("El tipo de parentesco no existe");

        var eliminado = await _repository.DeleteAsync(request.IdTipoParentesco, cancellationToken);

        return eliminado
            ? Response<bool>.Success(true, "Tipo de parentesco eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el tipo de parentesco");
    }
}
