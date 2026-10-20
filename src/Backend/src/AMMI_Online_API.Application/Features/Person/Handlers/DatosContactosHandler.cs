using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using AMMI_Online_API.Domain.Interfaces.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class GetDatosContactosHandler : IRequestHandler<GetByDatosContactosAsync, Response<IEnumerable<DatosContactoDTO>>>
{
    private readonly IDatosContacto _repository;
    public GetDatosContactosHandler(IDatosContacto repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<DatosContactoDTO>>> Handle(GetByDatosContactosAsync request, CancellationToken cancellationToken)
    {
        var datosContactos = await _repository.FindAsync(
            request.IdDatosContacto,
            request.IdPersona,
            request.IdTipoDatoContacto,
            request.Detalle,
            request.EsPrincipal,
            cancellationToken);
        if (!datosContactos.Any())
            return Response<IEnumerable<DatosContactoDTO>>.Failure("No se encontraron resultados");
        var result = datosContactos.Select(dc => new DatosContactoDTO
        {
            IdDatosContacto = dc.IdDatosContacto,
            IdPersona = dc.IdPersona,
            IdTipoDatoContacto = dc.IdTipoDatoContacto,
            Detalle = dc.Detalle,
            EsPrincipal = dc.EsPrincipal
        });
        return Response<IEnumerable<DatosContactoDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateDatosContactosHandler : IRequestHandler<CreateDatosContactosCommand, Response<int>>
{
    private readonly IDatosContacto _repository;
    public CreateDatosContactosHandler(IDatosContacto repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreateDatosContactosCommand request, CancellationToken cancellationToken)
    {
        int createdCount = 0;
        foreach (var item in request.DatosContactos)
        {
            var entity = new Domain.Entities.DatosContacto
            {
                IdPersona = item.IdPersona,
                IdTipoDatoContacto = item.IdTipoDatoContacto,
                Detalle = item.Detalle,
                EsPrincipal = item.EsPrincipal
            };
            await _repository.AddAsync(entity, cancellationToken);
            createdCount++;
        }
        return Response<int>.Success(createdCount, "Datos de contacto creados correctamente");
    }
}


public class UpdateDatosContactosHandler : IRequestHandler<UpdateDatosContactosCommand, Response<bool>>
{
    private readonly IDatosContacto _repository;
    public UpdateDatosContactosHandler(IDatosContacto repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(UpdateDatosContactosCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdDatosContacto, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Datos de contacto no encontrado");
        entity.IdPersona = request.IdPersona;
        entity.IdTipoDatoContacto = request.IdTipoDatoContacto;
        entity.Detalle = request.Detalle;
        entity.EsPrincipal = request.EsPrincipal;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Datos de contacto actualizados correctamente");
    }
}
public class DeleteDatosContactosHandler : IRequestHandler<DeleteDatosContactosCommand, Response<bool>>
{
    private readonly IDatosContacto _repository;
    public DeleteDatosContactosHandler(IDatosContacto repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeleteDatosContactosCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdDatosContacto, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure("Datos de contacto no encontrado");
        await _repository.DeleteAsync(entity.IdDatosContacto, cancellationToken);
        return Response<bool>.Success(true, "Datos de contacto eliminados correctamente");
    }
}