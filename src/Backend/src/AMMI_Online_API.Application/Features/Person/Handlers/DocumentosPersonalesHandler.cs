using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class GetDocumentosPersonalesHandler : IRequestHandler<GetByDocumentosPersonalesQuery, Response<IEnumerable<DocumentosPersonalesDTO>>>
{
    private readonly IDocumentosPersonales _repository;
    public GetDocumentosPersonalesHandler(IDocumentosPersonales repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<DocumentosPersonalesDTO>>> Handle(GetByDocumentosPersonalesQuery request, CancellationToken cancellationToken)
    {
        var documentosPersonales = await _repository.FindAsync(
            request.IdDocumentosPersonales,
            request.IdPersona,
            request.IdTipoDocumentoPersonal,
            request.IdAdjunto,
            request.CodigoRequisito,
            request.Estado,
            request.ValorDato,
            request.Observacion,
            cancellationToken);
        if (!documentosPersonales.Any())
            return Response<IEnumerable<DocumentosPersonalesDTO>>.Failure("No se encontraron resultados");
        var result = documentosPersonales.Select(dp => new DocumentosPersonalesDTO
        {
            IdDocumentosPersonales = dp.IdDocumentosPersonales,
            IdPersona = dp.IdPersona,
            IdTipoDocumentoPersonal = dp.IdTipoDocumentoPersonal,
            IdAdjunto = dp.IdAdjunto,
            CodigoRequisito = dp.CodigoRequisito,
            Estado = dp.Estado,
            ValorDato = dp.ValorDato,
            Observacion = dp.Observacion
        });
        return Response<IEnumerable<DocumentosPersonalesDTO>>.Success(result, "Consulta realizada correctamente");
    }
}

public class CreateDocumentosPersonalesHandler : IRequestHandler<CreateDocumentosPersonalesCommand, Response<int>>
{
    private readonly IDocumentosPersonales _repository;

    public CreateDocumentosPersonalesHandler(IDocumentosPersonales repository)
    {
        _repository = repository;
    }

    public async Task<Response<int>> Handle(CreateDocumentosPersonalesCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var documentos = JsonSerializer.Deserialize<List<CreateDocumentosPersonalesItem>>(
                request.DocumentosPersonalesJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                ?? new List<CreateDocumentosPersonalesItem>();

            int createdCount = 0;
            int archivoIndex = 0;

            foreach (var item in documentos)
            {
                var archivo = item.TieneArchivo &&
                             request.ArchivosDocumentos != null &&
                             archivoIndex < request.ArchivosDocumentos.Count
                    ? request.ArchivosDocumentos[archivoIndex++]
                    : null;

                try
                {
                    await _repository.AddWithFileAsync(new DocumentosPersonales
                    {
                        IdPersona = item.IdPersona,
                        IdTipoDocumentoPersonal = item.IdTipoDocumentoPersonal,
                        CodigoRequisito = item.CodigoRequisito,
                        Estado = item.Estado,
                        ValorDato = item.ValorDato,
                        Observacion = item.Observacion
                    }, archivo, cancellationToken);

                    createdCount++;
                }
                catch { }
            }

            return Response<int>.Success(createdCount, createdCount == 0
                ? "No se crearon documentos"
                : $"{createdCount} documentos creados");
        }
        catch
        {
            return Response<int>.Failure("Error en la solicitud");
        }
    }
}

public class UpdateDocumentosPersonalesHandler : IRequestHandler<UpdateDocumentosPersonalesCommand, Response<bool>>
{
    private readonly IDocumentosPersonales _repository;

    public UpdateDocumentosPersonalesHandler(IDocumentosPersonales repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(UpdateDocumentosPersonalesCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _repository.UpdateWithFileAsync(
                request.IdDocumentosPersonales,
                new DocumentosPersonales
                {
                    IdPersona = request.IdPersona,
                    IdTipoDocumentoPersonal = request.IdTipoDocumentoPersonal,
                    CodigoRequisito = request.CodigoRequisito,
                    Estado = request.Estado,
                    ValorDato = request.ValorDato,
                    Observacion = request.Observacion
                },
                request.ArchivoDocumento,
                cancellationToken);

            return Response<bool>.Success(true, "Documento personal actualizado exitosamente.");
        }
        catch (KeyNotFoundException ex)
        {
            return Response<bool>.Failure(ex.Message);
        }
        catch (Exception)
        {
            return Response<bool>.Failure("Error al actualizar documento personal");
        }
    }
}

public class DeleteDocumentosPersonalesHandler : IRequestHandler<DeleteDocumentosPersonalesCommand, Response<bool>>
{
    private readonly IDocumentosPersonales _repository;

    public DeleteDocumentosPersonalesHandler(IDocumentosPersonales repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(DeleteDocumentosPersonalesCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.IdDocumentosPersonales, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("El documento personal no existe.");

        await _repository.DeleteWithFileAsync(request.IdDocumentosPersonales, cancellationToken);
        return Response<bool>.Success(true, "Documento personal eliminado exitosamente.");
    }
}
