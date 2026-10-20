using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllPaisQueryHandler : IRequestHandler<GetAllPaisQuery, Response<IEnumerable<PaisDTO>>>
{
    private readonly IPaisRepository _repository;

    public GetAllPaisQueryHandler(IPaisRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<PaisDTO>>> Handle(GetAllPaisQuery request, CancellationToken cancellationToken)
    {
        var paises = await _repository.GetAllAsync(cancellationToken);

        var dtos = paises.Select(p => new PaisDTO
        {
            IdPais = p.IdPais,
            Nombre = p.Nombre,
            Nacionalidad = p.Nacionalidad,
            EsEcuador = p.EsEcuador
        });

        return new Response<IEnumerable<PaisDTO>>(dtos);
    }
}

public class CreatePaisCommandHandler : IRequestHandler<CreatePaisCommand, Response<int>>
{
    private readonly IPaisRepository _repository;

    public CreatePaisCommandHandler(IPaisRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreatePaisCommand request, CancellationToken cancellationToken)
    {
        var pais = new Pais
        {
            Nombre = request.paisDTO.Nombre,
            Nacionalidad = request.paisDTO.Nacionalidad,
            EsEcuador = request.paisDTO.EsEcuador
        };

        var created = await _repository.AddAsync(pais, cancellationToken);

        return Response<int>.Success(created.IdPais, "País creado correctamente");
    }
}

public class UpdatePaisCommandHandler : IRequestHandler<UpdatePaisCommand, Response<bool>>
{
    private readonly IPaisRepository _repository;

    public UpdatePaisCommandHandler(IPaisRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdatePaisCommand request, CancellationToken cancellationToken)
    {
        var pais = await _repository.GetByIdAsync(request.paisDTO.IdPais, cancellationToken);

        if (pais == null)
            return Response<bool>.Failure("El país no existe");

        pais.Nombre = request.paisDTO.Nombre;
        pais.Nacionalidad = request.paisDTO.Nacionalidad;
        pais.EsEcuador = request.paisDTO.EsEcuador;

        await _repository.UpdateAsync(pais, cancellationToken);

        return Response<bool>.Success(true, "País actualizado correctamente");
    }
}

public class DeletePaisCommandHandler : IRequestHandler<DeletePaisCommand, Response<bool>>
{
    private readonly IPaisRepository _repository;

    public DeletePaisCommandHandler(IPaisRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeletePaisCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdPais, cancellationToken))
            return Response<bool>.Failure("El país no existe");

        var deleted = await _repository.DeleteAsync(request.IdPais, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "País eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el país");
    }
}
