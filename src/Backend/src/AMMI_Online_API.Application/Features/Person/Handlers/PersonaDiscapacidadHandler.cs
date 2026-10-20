using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Adjuntos;
using AMMI_Online_API.Domain.Interfaces.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class GetPersonaDiscapacidadHandler : IRequestHandler<GetByPersonaDiscapacidadAsync, Response<IEnumerable<PersonaDiscapacidadDTO>>>
{
    private readonly IPersonaDiscapacidad _personaDiscapacidadRepository;
    private readonly IAdjuntos _adjuntosRepository;

    public GetPersonaDiscapacidadHandler(
        IPersonaDiscapacidad personaDiscapacidadRepository,
        IAdjuntos adjuntosRepository)
    {
        _personaDiscapacidadRepository = personaDiscapacidadRepository;
        _adjuntosRepository = adjuntosRepository;
    }

    public async Task<Response<IEnumerable<PersonaDiscapacidadDTO>>> Handle(GetByPersonaDiscapacidadAsync request, CancellationToken cancellationToken)
    {
        var personaDiscapacidades = await _personaDiscapacidadRepository.FindAsync(
            request.IdPersonaDiscapacidad,
            request.IdPersona,
            request.Porcentaje,
            request.Recomendaciones,
            request.IdTipoDiscapacidad,
            request.IdAdjunto,
            cancellationToken);

        if (!personaDiscapacidades.Any())
            return Response<IEnumerable<PersonaDiscapacidadDTO>>.Failure("No se encontraron personas con discapacidad.");

        var result = new List<PersonaDiscapacidadDTO>();
        foreach (var p in personaDiscapacidades)
        {
            var adjunto = await _adjuntosRepository.GetByIdAsync(p.IdAdjunto, cancellationToken);

            result.Add(new PersonaDiscapacidadDTO
            {
                IdPersonaDiscapacidad = p.IdPersonaDiscapacidad,
                IdPersona = p.IdPersona,
                Porcentaje = p.Porcentaje,
                Recomendaciones = p.Recomendaciones,
                IdTipoDiscapacidad = p.IdTipoDiscapacidad,
                IdAdjunto = p.IdAdjunto,
                PathAdjunto = adjunto?.Path
            });
        }

        return Response<IEnumerable<PersonaDiscapacidadDTO>>.Success(result, "Consulta ejecutada exitosamente.");
    }
}

public class CreatePersonaDiscapacidadHandler : IRequestHandler<CreatePersonaDiscapacidadCommand, Response<int>>
{
    private readonly IPersonaDiscapacidad _personaDiscapacidadRepository;
    private readonly IAdjuntos _adjuntosRepository;

    public CreatePersonaDiscapacidadHandler(
        IPersonaDiscapacidad personaDiscapacidadRepository,
        IAdjuntos adjuntosRepository)
    {
        _personaDiscapacidadRepository = personaDiscapacidadRepository;
        _adjuntosRepository = adjuntosRepository;
    }

    public async Task<Response<int>> Handle(CreatePersonaDiscapacidadCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Guardar el archivo usando tu repositorio IAdjuntos
            string subcarpeta = "discapacidades";
            var adjuntoGuardado = await _adjuntosRepository.GuardarArchivoAsync(
                request.Archivo,
                subcarpeta,
                cancellationToken);

            if (adjuntoGuardado == null)
            {
                return Response<int>.Failure("Error al guardar el archivo adjunto");
            }

            // 2. Crear la persona discapacidad con el ID del adjunto
            var personaDiscapacidad = new PersonaDiscapacidad
            {
                IdPersona = request.IdPersona,
                Porcentaje = request.Porcentaje,
                Recomendaciones = request.Recomendaciones,
                IdTipoDiscapacidad = request.IdTipoDiscapacidad,
                IdAdjunto = adjuntoGuardado.IdAdjunto
            };

            var createdEntity = await _personaDiscapacidadRepository.AddAsync(personaDiscapacidad, cancellationToken);

            return Response<int>.Success(createdEntity.IdPersonaDiscapacidad, "Persona discapacidad creada correctamente");
        }
        catch (Exception ex)
        {
            return Response<int>.Failure($"Error al crear la persona discapacidad: {ex.Message}");
        }
    }
}

public class UpdatePersonaDiscapacidadHandler : IRequestHandler<UpdatePersonaDiscapacidadCommand, Response<bool>>
{
    private readonly IPersonaDiscapacidad _personaDiscapacidadRepository;
    private readonly IAdjuntos _adjuntosRepository;

    public UpdatePersonaDiscapacidadHandler(
        IPersonaDiscapacidad personaDiscapacidadRepository,
        IAdjuntos adjuntosRepository)
    {
        _personaDiscapacidadRepository = personaDiscapacidadRepository;
        _adjuntosRepository = adjuntosRepository;
    }

    public async Task<Response<bool>> Handle(UpdatePersonaDiscapacidadCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var existingEntity = await _personaDiscapacidadRepository.GetByIdAsync(request.IdPersonaDiscapacidad, cancellationToken);
            if (existingEntity == null)
            {
                return Response<bool>.Failure("Persona discapacidad no encontrada");
            }

            // Si se proporciona un nuevo archivo
            if (request.Archivo != null)
            {
                // Eliminar el archivo anterior usando tu repositorio
                await _adjuntosRepository.EliminarArchivoAsync(existingEntity.IdAdjunto, cancellationToken);

                // Guardar el nuevo archivo
                string subcarpeta = "discapacidades";
                var nuevoAdjunto = await _adjuntosRepository.GuardarArchivoAsync(
                    request.Archivo,
                    subcarpeta,
                    cancellationToken);

                if (nuevoAdjunto == null)
                {
                    return Response<bool>.Failure("Error al guardar el nuevo archivo adjunto");
                }

                existingEntity.IdAdjunto = nuevoAdjunto.IdAdjunto;
            }

            // Actualizar los demás campos
            existingEntity.IdPersona = request.IdPersona;
            existingEntity.Porcentaje = request.Porcentaje;
            existingEntity.Recomendaciones = request.Recomendaciones;
            existingEntity.IdTipoDiscapacidad = request.IdTipoDiscapacidad;

            await _personaDiscapacidadRepository.UpdateAsync(existingEntity, cancellationToken);

            return Response<bool>.Success(true, "Persona discapacidad actualizada correctamente");
        }
        catch (Exception ex)
        {
            return Response<bool>.Failure($"Error al actualizar la persona discapacidad: {ex.Message}");
        }
    }
}

public class DeletePersonaDiscapacidadHandler : IRequestHandler<DeletePersonaDiscapacidadCommand, Response<bool>>
{
    private readonly IPersonaDiscapacidad _personaDiscapacidadRepository;
    private readonly IAdjuntos _adjuntosRepository;

    public DeletePersonaDiscapacidadHandler(
        IPersonaDiscapacidad personaDiscapacidadRepository,
        IAdjuntos adjuntosRepository)
    {
        _personaDiscapacidadRepository = personaDiscapacidadRepository;
        _adjuntosRepository = adjuntosRepository;
    }

    public async Task<Response<bool>> Handle(DeletePersonaDiscapacidadCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var exists = await _personaDiscapacidadRepository.ExistsAsync(request.IdPersonaDiscapacidad, cancellationToken);
            if (!exists)
            {
                return Response<bool>.Failure("Persona discapacidad no encontrada");
            }

            // Obtener la persona discapacidad para acceder al ID del adjunto
            var personaDiscapacidad = await _personaDiscapacidadRepository.GetByIdAsync(request.IdPersonaDiscapacidad, cancellationToken);

            // Eliminar el archivo usando tu repositorio (esto elimina tanto el archivo físico como el registro)
            await _adjuntosRepository.EliminarArchivoAsync(personaDiscapacidad.IdAdjunto, cancellationToken);

            // Eliminar el registro de persona discapacidad
            await _personaDiscapacidadRepository.DeleteAsync(request.IdPersonaDiscapacidad, cancellationToken);

            return Response<bool>.Success(true, "Persona discapacidad eliminada correctamente");
        }
        catch (Exception ex)
        {
            return Response<bool>.Failure($"Error al eliminar la persona discapacidad: {ex.Message}");
        }
    }
}