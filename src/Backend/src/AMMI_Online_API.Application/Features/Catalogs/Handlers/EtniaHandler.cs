using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllEtniasQueryHandler : IRequestHandler<GetAllEtniasQuery, Response<IEnumerable<EtniaDTO>>>
{
    private readonly IEtniaRepository _repository;

    public GetAllEtniasQueryHandler(IEtniaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<EtniaDTO>>> Handle(GetAllEtniasQuery request, CancellationToken cancellationToken)
    {
        var etnias = await _repository.GetAllAsync(cancellationToken);

        var dtos = etnias.Select(e => new EtniaDTO
        {
            IdEtnia = e.IdEtnia,
            Nombre = e.Nombre,
            Default = e.Default
        });

        return new Response<IEnumerable<EtniaDTO>>(dtos);
    }
}

public class CreateEtniaCommandHandler : IRequestHandler<CreateEtniaCommand, Response<int>>
{
    private readonly IEtniaRepository _repository;

    public CreateEtniaCommandHandler(IEtniaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateEtniaCommand request, CancellationToken cancellationToken)
    {
        var etnia = new Etnia
        {
            Nombre = request.Nombre,
            Default = request.Default
        };

        var etniaCreada = await _repository.AddAsync(etnia, cancellationToken);

        return Response<int>.Success(etniaCreada.IdEtnia, "Etnia creada correctamente");
    }
}

public class UpdateEtniaCommandHandler : IRequestHandler<UpdateEtniaCommand, Response<bool>>
{
    private readonly IEtniaRepository _repository;

    public UpdateEtniaCommandHandler(IEtniaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateEtniaCommand request, CancellationToken cancellationToken)
    {
        var etnia = await _repository.GetByIdAsync(request.IdEtnia, cancellationToken);

        if (etnia == null)
            return Response<bool>.Failure("Etnia no encontrada");

        etnia.Nombre = request.Nombre;
        etnia.Default = request.Default;

        await _repository.UpdateAsync(etnia, cancellationToken);

        return Response<bool>.Success(true, "Etnia actualizada correctamente");
    }
}

public class DeleteEtniaCommandHandler : IRequestHandler<DeleteEtniaCommand, Response<bool>>
{
    private readonly IEtniaRepository _repository;

    public DeleteEtniaCommandHandler(IEtniaRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteEtniaCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdEtnia, cancellationToken))
            return Response<bool>.Failure("Etnia no encontrada");

        var eliminada = await _repository.DeleteAsync(request.IdEtnia, cancellationToken);

        return eliminada
            ? Response<bool>.Success(true, "Etnia eliminada correctamente")
            : Response<bool>.Failure("No se pudo eliminar la etnia");
    }
}
