using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllProvinciaQueryHandler : IRequestHandler<GetAllProvinciaQuery, Response<IEnumerable<ProvinciaDTO>>>
{
    private readonly IProvinciaRepository _repository;

    public GetAllProvinciaQueryHandler(IProvinciaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<ProvinciaDTO>>> Handle(GetAllProvinciaQuery request, CancellationToken cancellationToken)
    {
        var provincias = await _repository.GetAllAsync(cancellationToken);

        var dtos = provincias.Select(p => new ProvinciaDTO
        {
            IdProvincia = p.IdProvincia,
            Nombre = p.Nombre,
            IdPais = p.IdPais
        });

        return new Response<IEnumerable<ProvinciaDTO>>(dtos);
    }
}

public class GetProvinciasByPaisQueryHandler : IRequestHandler<GetProvinciasByPaisQuery, Response<IEnumerable<ProvinciaDTO>>>
{
    private readonly IProvinciaRepository _repository;

    public GetProvinciasByPaisQueryHandler(IProvinciaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<ProvinciaDTO>>> Handle(GetProvinciasByPaisQuery request, CancellationToken cancellationToken)
    {
        var provincias = await _repository.GetByPaisAsync(request.IdPais, cancellationToken);

        var dtos = provincias.Select(p => new ProvinciaDTO
        {
            IdProvincia = p.IdProvincia,
            Nombre = p.Nombre,
            IdPais = p.IdPais
        });

        return new Response<IEnumerable<ProvinciaDTO>>(dtos);
    }
}

public class CreateProvinciaCommandHandler : IRequestHandler<CreateProvinciaCommand, Response<int>>
{
    private readonly IProvinciaRepository _repository;

    public CreateProvinciaCommandHandler(IProvinciaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateProvinciaCommand request, CancellationToken cancellationToken)
    {
        var provincia = new Provincia
        {
            Nombre = request.provinciaDTO.Nombre,
            IdPais = request.provinciaDTO.IdPais
        };

        var created = await _repository.AddAsync(provincia, cancellationToken);

        return Response<int>.Success(created.IdProvincia, "Provincia creada correctamente");
    }
}

public class UpdateProvinciaCommandHandler : IRequestHandler<UpdateProvinciaCommand, Response<bool>>
{
    private readonly IProvinciaRepository _repository;

    public UpdateProvinciaCommandHandler(IProvinciaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateProvinciaCommand request, CancellationToken cancellationToken)
    {
        var provincia = await _repository.GetByIdAsync(request.provinciaDTO.IdProvincia, cancellationToken);

        if (provincia == null)
            return Response<bool>.Failure("La provincia no existe");

        provincia.Nombre = request.provinciaDTO.Nombre;
        provincia.IdPais = request.provinciaDTO.IdPais;

        await _repository.UpdateAsync(provincia, cancellationToken);

        return Response<bool>.Success(true, "Provincia actualizada correctamente");
    }
}

public class DeleteProvinciaCommandHandler : IRequestHandler<DeleteProvinciaCommand, Response<bool>>
{
    private readonly IProvinciaRepository _repository;

    public DeleteProvinciaCommandHandler(IProvinciaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteProvinciaCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdProvincia, cancellationToken))
            return Response<bool>.Failure("La provincia no existe");

        var deleted = await _repository.DeleteAsync(request.IdProvincia, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Provincia eliminada correctamente")
            : Response<bool>.Failure("No se pudo eliminar la provincia");
    }
}
