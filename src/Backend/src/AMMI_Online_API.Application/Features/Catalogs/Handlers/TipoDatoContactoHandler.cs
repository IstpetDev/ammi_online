using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Handlers;

public class GetAllTipoDatoContactoQueryHandler : IRequestHandler<GetAllTipoDatoContactoQuery, Response<IEnumerable<TipoDatoContactoDTO>>>
{
    private readonly ITipoDatoContactoRepository _repository;

    public GetAllTipoDatoContactoQueryHandler(ITipoDatoContactoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<TipoDatoContactoDTO>>> Handle(GetAllTipoDatoContactoQuery request, CancellationToken cancellationToken)
    {
        var tiposDatoContacto = await _repository.GetAllAsync(cancellationToken);

        var dtos = tiposDatoContacto.Select(tdc => new TipoDatoContactoDTO
        {
            IdTipoDatoContacto = tdc.IdTipoDatoContacto,
            Detalle = tdc.Detalle,
            EsObligatorio = tdc.EsObligatorio
        });

        return new Response<IEnumerable<TipoDatoContactoDTO>>(dtos);
    }
}

public class CreateTipoDatoContactoCommandHandler : IRequestHandler<CreateTipoDatoContactoCommand, Response<int>>
{
    private readonly ITipoDatoContactoRepository _repository;

    public CreateTipoDatoContactoCommandHandler(ITipoDatoContactoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateTipoDatoContactoCommand request, CancellationToken cancellationToken)
    {
        var tipoDatoContacto = new TipoDatoContacto
        {
            Detalle = request.tipoDatoContactoDTO.Detalle,
            EsObligatorio = request.tipoDatoContactoDTO.EsObligatorio
        };

        var created = await _repository.AddAsync(tipoDatoContacto, cancellationToken);

        return Response<int>.Success(created.IdTipoDatoContacto, "Tipo de dato de contacto creado correctamente");
    }
}

public class UpdateTipoDatoContactoCommandHandler : IRequestHandler<UpdateTipoDatoContactoCommand, Response<bool>>
{
    private readonly ITipoDatoContactoRepository _repository;

    public UpdateTipoDatoContactoCommandHandler(ITipoDatoContactoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateTipoDatoContactoCommand request, CancellationToken cancellationToken)
    {
        var tipoDatoContacto = await _repository.GetByIdAsync(request.tipoDatoContactoDTO.IdTipoDatoContacto, cancellationToken);

        if (tipoDatoContacto == null)
            return Response<bool>.Failure("El tipo de dato de contacto no existe");

        tipoDatoContacto.Detalle = request.tipoDatoContactoDTO.Detalle;
        tipoDatoContacto.EsObligatorio = request.tipoDatoContactoDTO.EsObligatorio;

        await _repository.UpdateAsync(tipoDatoContacto, cancellationToken);

        return Response<bool>.Success(true, "Tipo de dato de contacto actualizado correctamente");
    }
}

public class DeleteTipoDatoContactoCommandHandler : IRequestHandler<DeleteTipoDatoContactoCommand, Response<bool>>
{
    private readonly ITipoDatoContactoRepository _repository;

    public DeleteTipoDatoContactoCommandHandler(ITipoDatoContactoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteTipoDatoContactoCommand request, CancellationToken cancellationToken)
    {
        if (!await _repository.ExistsAsync(request.IdTipoDatoContacto, cancellationToken))
            return Response<bool>.Failure("El tipo de dato de contacto no existe");

        var deleted = await _repository.DeleteAsync(request.IdTipoDatoContacto, cancellationToken);

        return deleted
            ? Response<bool>.Success(true, "Tipo de dato de contacto eliminado correctamente")
            : Response<bool>.Failure("No se pudo eliminar el tipo de dato de contacto");
    }
}
