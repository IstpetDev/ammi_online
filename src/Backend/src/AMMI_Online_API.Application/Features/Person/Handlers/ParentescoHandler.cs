using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class GetParentescoHandler : IRequestHandler<GetByParentescoAsync, Response<IEnumerable<ParentescoDTO>>>
{
    private readonly IParentesco _repository;
    public GetParentescoHandler(IParentesco repository)
    {
        _repository = repository;
    }
    public async Task<Response<IEnumerable<ParentescoDTO>>> Handle(GetByParentescoAsync request, CancellationToken cancellationToken)
    {
        var parentescos = await _repository.FindAsync(
            request.IdParentesco,
            request.IdPersonaOrigen,
            request.IdPersonaDestino,
            request.IdTipoParentesco,
            request.Representante,
            request.Tutor,
            request.ResponsableFinciero,
            request.ConviveAlumno,
            cancellationToken);
        if (!parentescos.Any())
            return Response<IEnumerable<ParentescoDTO>>.Failure("No se encontraron resultados");
        var result = parentescos.Select(p => new ParentescoDTO
        {
            IdParentesco = p.IdParentesco,
            IdPersonaOrigen = p.IdPersonaOrigen,
            IdPersonaDestino = p.IdPersonaDestino,
            IdTipoParentesco = p.IdTipoParentesco,
            Representante = p.Representante,
            Tutor = p.Tutor,
            ResponsableFinciero = p.ResponsableFinciero,
            ConviveAlumno = p.ConviveAlumno
        });
        return Response<IEnumerable<ParentescoDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateParentescoHandler : IRequestHandler<CreateParentescoCommand, Response<int>>
{
    private readonly IParentesco _repository;
    public CreateParentescoHandler(IParentesco repository)
    {
        _repository = repository;
    }
    public async Task<Response<int>> Handle(CreateParentescoCommand request, CancellationToken cancellationToken)
    {
        int createdCount = 0;
        foreach (var item in request.Parentescos)
        {
            var entity = new Parentesco
            {
                IdPersonaOrigen = item.IdPersonaOrigen,
                IdPersonaDestino = item.IdPersonaDestino,
                IdTipoParentesco = item.IdTipoParentesco,
                Representante = item.Representante,
                Tutor = item.Tutor,
                ResponsableFinciero = item.ResponsableFinciero,
                ConviveAlumno = item.ConviveAlumno
            };
            await _repository.AddAsync(entity, cancellationToken);
            createdCount++;
        }
        return Response<int>.Success(createdCount, $"{createdCount} registros creados exitosamente.");
    }
}

public class UpdateParentescoHandler : IRequestHandler<UpdateParentescoCommand, Response<bool>>
{
    private readonly IParentesco _repository;
    public UpdateParentescoHandler(IParentesco repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(UpdateParentescoCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdParentesco, cancellationToken);
        if (entity == null)
        {
            return Response<bool>.Failure("Parentesco no encontrado");
        }
        entity.IdPersonaOrigen = request.IdPersonaOrigen;
        entity.IdPersonaDestino = request.IdPersonaDestino;
        entity.IdTipoParentesco = request.IdTipoParentesco;
        entity.Representante = request.Representante;
        entity.Tutor = request.Tutor;
        entity.ResponsableFinciero = request.ResponsableFinciero;
        entity.ConviveAlumno = request.ConviveAlumno;
        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Parentesco actualizado correctamente");
    }
}

public class DeleteParentescoHandler : IRequestHandler<DeleteParentescoCommand, Response<bool>>
{
    private readonly IParentesco _repository;
    public DeleteParentescoHandler(IParentesco repository)
    {
        _repository = repository;
    }
    public async Task<Response<bool>> Handle(DeleteParentescoCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdParentesco, cancellationToken);
        if (entity == null)
        {
            return Response<bool>.Failure("Parentesco no encontrado");
        }
        await _repository.DeleteAsync(entity.IdParentesco, cancellationToken);
        return Response<bool>.Success(true, "Parentesco eliminado correctamente");
    }
}