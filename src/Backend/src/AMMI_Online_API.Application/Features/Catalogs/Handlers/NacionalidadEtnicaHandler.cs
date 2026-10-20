using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllNacionalidadEtnicaQueryHandler : IRequestHandler<GetAllNacionalidadEtnicaQuery, Response<IEnumerable<NacionalidadEtnicaDTO>>>
{
    private readonly INacionalidadEtnicaRepository _repository;

    public GetAllNacionalidadEtnicaQueryHandler(INacionalidadEtnicaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<NacionalidadEtnicaDTO>>> Handle(GetAllNacionalidadEtnicaQuery request, CancellationToken cancellationToken)
    {
        var nacionalidadesEtnicas = await _repository.GetAllAsync(cancellationToken);

        var dtos = nacionalidadesEtnicas.Select(ne => new NacionalidadEtnicaDTO
        {
            IdnacionalidadEtnica = ne.IdnacionalidadEtnica,
            Nombre = ne.Nombre,
            EsNinguna = ne.EsNinguna,
            IdEtnia = ne.IdEtnia
        });

        return new Response<IEnumerable<NacionalidadEtnicaDTO>>(dtos);
    }
}

public class GetNacionalidadEtnicaByEtniaQueryHandler : IRequestHandler<GetNacionalidadEtnicaByEtniaQuery, Response<IEnumerable<NacionalidadEtnicaDTO>>>
{
    private readonly INacionalidadEtnicaRepository _repository;

    public GetNacionalidadEtnicaByEtniaQueryHandler(INacionalidadEtnicaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<NacionalidadEtnicaDTO>>> Handle(GetNacionalidadEtnicaByEtniaQuery request, CancellationToken cancellationToken)
    {
        var nacionalidadesEtnicas = await _repository.GetByEtniaAsync(request.IdEtnia, cancellationToken);

        var dtos = nacionalidadesEtnicas.Select(ne => new NacionalidadEtnicaDTO
        {
            IdnacionalidadEtnica = ne.IdnacionalidadEtnica,
            Nombre = ne.Nombre,
            EsNinguna = ne.EsNinguna,
            IdEtnia = ne.IdEtnia
        });

        return new Response<IEnumerable<NacionalidadEtnicaDTO>>(dtos);
    }
}

public class CreateNacionalidadEtnicaCommandHandler : IRequestHandler<CreateNacionalidadEtnicaCommand, Response<int>>
{
    private readonly INacionalidadEtnicaRepository _repository;

    public CreateNacionalidadEtnicaCommandHandler(INacionalidadEtnicaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateNacionalidadEtnicaCommand request, CancellationToken cancellationToken)
    {
        var nacionalidadEtnica = new NacionalidadEtnica
        {
            Nombre = request.nacionalidadEtnicaDTO.Nombre,
            EsNinguna = request.nacionalidadEtnicaDTO.EsNinguna,
            IdEtnia = request.nacionalidadEtnicaDTO.IdEtnia
        };

        var created = await _repository.AddAsync(nacionalidadEtnica, cancellationToken);

        return Response<int>.Success(created.IdnacionalidadEtnica, "Nacionalidad étnica creada correctamente");
    }
}

public class UpdateNacionalidadEtnicaCommandHandler : IRequestHandler<UpdateNacionalidadEtnicaCommand, Response<bool>>
{
    private readonly INacionalidadEtnicaRepository _repository;

    public UpdateNacionalidadEtnicaCommandHandler(INacionalidadEtnicaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateNacionalidadEtnicaCommand request, CancellationToken cancellationToken)
    {
        var nacionalidadEtnica = await _repository.GetByIdAsync(request.nacionalidadEtnicaDTO.IdnacionalidadEtnica, cancellationToken);

        if (nacionalidadEtnica == null)
            return Response<bool>.Failure("La nacionalidad étnica no existe");

        nacionalidadEtnica.Nombre = request.nacionalidadEtnicaDTO.Nombre;
        nacionalidadEtnica.EsNinguna = request.nacionalidadEtnicaDTO.EsNinguna;
        nacionalidadEtnica.IdEtnia = request.nacionalidadEtnicaDTO.IdEtnia;

        await _repository.UpdateAsync(nacionalidadEtnica, cancellationToken);

        return Response<bool>.Success(true, "Nacionalidad étnica actualizada correctamente");
    }
}

public class DeleteNacionalidadEtnicaCommandHandler : IRequestHandler<DeleteNacionalidadEtnicaCommand, Response<bool>>
{
    private readonly INacionalidadEtnicaRepository _repository;

    public DeleteNacionalidadEtnicaCommandHandler(INacionalidadEtnicaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteNacionalidadEtnicaCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdNacionalidadEtnica, cancellationToken))
            return Response<bool>.Failure("La nacionalidad étnica no existe");

        var deleted = await _repository.DeleteAsync(request.IdNacionalidadEtnica, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Nacionalidad étnica eliminada correctamente")
            : Response<bool>.Failure("No se pudo eliminar la nacionalidad étnica");
    }
}
