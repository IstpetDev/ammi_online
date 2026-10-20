using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class FotoPerfilHandler :
    IRequestHandler<GetFotoPerfilByDocumentoQuery, Response<FotoPerfilDTO>>,
    IRequestHandler<GetFotoPerfilByPersonaIdQuery, Response<FotoPerfilDTO>>,
    IRequestHandler<UpdateFotoPerfilCommand, Response<FotoPerfilDTO>>,
    IRequestHandler<DeleteFotoPerfilCommand, Response<bool>>,
    IRequestHandler<DeleteFotoPerfilAdminByDocumentoCommand, Response<bool>>,
    IRequestHandler<DeleteFotoPerfilAdminByPersonaIdCommand, Response<bool>>
{
    private readonly IFotoPerfilRepository _repository;

    public FotoPerfilHandler(IFotoPerfilRepository repository)
    {
        _repository = repository;
    }

    private static FotoPerfilDTO MapToDTO(DocumentosPersonales dp) => new()
    {
        IdDocumentosPersonales = dp.IdDocumentosPersonales,
        IdPersona = dp.IdPersona,
        NombreCompleto = dp.IdPersonaNavigation != null
            ? $"{dp.IdPersonaNavigation.PrimerNombre} {dp.IdPersonaNavigation.PrimerApellido}".Trim()
            : string.Empty,
        Documento = dp.IdPersonaNavigation?.Documento ?? string.Empty,
        PathFoto = dp.IdAdjuntoNavigation?.Path,
        Estado = dp.Estado
    };

    public async Task<Response<FotoPerfilDTO>> Handle(GetFotoPerfilByDocumentoQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByDocumentoAsync(request.Documento, cancellationToken);
        if (entity == null)
            return Response<FotoPerfilDTO>.Failure("No se encontró foto de perfil para el documento indicado.");
        return Response<FotoPerfilDTO>.Success(MapToDTO(entity), "Foto de perfil encontrada.");
    }

    public async Task<Response<FotoPerfilDTO>> Handle(GetFotoPerfilByPersonaIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByPersonaIdAsync(request.IdPersona, cancellationToken);
        if (entity == null)
            return Response<FotoPerfilDTO>.Failure("No se encontró foto de perfil para la persona indicada.");
        return Response<FotoPerfilDTO>.Success(MapToDTO(entity), "Foto de perfil encontrada.");
    }

    public async Task<Response<FotoPerfilDTO>> Handle(UpdateFotoPerfilCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _repository.UpdateFotoAsync(request.IdDocumentosPersonales, request.Archivo, cancellationToken);
            return Response<FotoPerfilDTO>.Success(MapToDTO(updated), "Foto de perfil actualizada correctamente.");
        }
        catch (KeyNotFoundException ex)
        {
            return Response<FotoPerfilDTO>.Failure(ex.Message);
        }
        catch (Exception)
        {
            return Response<FotoPerfilDTO>.Failure("Error al actualizar la foto de perfil.");
        }
    }

    public async Task<Response<bool>> Handle(DeleteFotoPerfilCommand request, CancellationToken cancellationToken)
    {
        var deleted = await _repository.DeleteFotoAsync(request.IdDocumentosPersonales, cancellationToken);
        return deleted
            ? Response<bool>.Success(true, "Foto de perfil eliminada correctamente.")
            : Response<bool>.Failure("No se encontró la foto de perfil.");
    }

    public async Task<Response<bool>> Handle(DeleteFotoPerfilAdminByDocumentoCommand request, CancellationToken cancellationToken)
    {
        var deleted = await _repository.DeleteFotoAdminByDocumentoAsync(request.Documento, cancellationToken);
        return deleted
            ? Response<bool>.Success(true, "Foto de perfil eliminada por administrador.")
            : Response<bool>.Failure("No se encontró foto de perfil para el documento indicado.");
    }

    public async Task<Response<bool>> Handle(DeleteFotoPerfilAdminByPersonaIdCommand request, CancellationToken cancellationToken)
    {
        var deleted = await _repository.DeleteFotoAdminByPersonaIdAsync(request.IdPersona, cancellationToken);
        return deleted
            ? Response<bool>.Success(true, "Foto de perfil eliminada por administrador.")
            : Response<bool>.Failure("No se encontró foto de perfil para la persona indicada.");
    }
}
