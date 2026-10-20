using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Handlers;

public class ContenidoMallaHandler :
    IRequestHandler<GetContenidoMallaByIdQuery, ContenidoMallaDTO>,
    IRequestHandler<GetContenidoMallaByDetalleMallaQuery, IEnumerable<ContenidoMallaDTO>>,
    IRequestHandler<CreateContenidoMallaCommand, ContenidoMallaDTO>,
    IRequestHandler<UpdateContenidoMallaCommand, ContenidoMallaDTO>,
    IRequestHandler<DeleteContenidoMallaCommand, bool>
{
    private readonly IContenidoMallaRepository _repository;
    private readonly IFileStorageService _fileStorageService;

    public ContenidoMallaHandler(IContenidoMallaRepository repository, IFileStorageService fileStorageService)
    {
        _repository = repository;
        _fileStorageService = fileStorageService;
    }

    public async Task<ContenidoMallaDTO> Handle(GetContenidoMallaByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null) return null;
        return MapToDTO(entity);
    }

    public async Task<IEnumerable<ContenidoMallaDTO>> Handle(GetContenidoMallaByDetalleMallaQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByDetalleMallaIdAsync(request.IdDetalleMalla, cancellationToken);
        return entities.Select(MapToDTO);
    }

    public async Task<ContenidoMallaDTO> Handle(CreateContenidoMallaCommand request, CancellationToken cancellationToken)
    {
        // 1. Guardar el archivo físico
        var fileName = await _fileStorageService.SaveFileAsync(
            request.CreateDto.Contenido,
            "contenido-malla",
            cancellationToken);

        // 2. Crear la entidad con el path/nombre del archivo
        var entity = new ContenidoMalla
        {
            IdDetalleMalla = request.CreateDto.IdDetalleMalla,
            Contenido = fileName, // Aquí va el path/nombre del archivo
            FechaRegistro = DateOnly.FromDateTime(DateTime.Now),
            EsActivo = true
        };

        var created = await _repository.AddAsync(entity, cancellationToken);
        return await Handle(new GetContenidoMallaByIdQuery(created.IdContenidoMalla), cancellationToken);
    }

   public async Task<ContenidoMallaDTO> Handle(UpdateContenidoMallaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null) throw new KeyNotFoundException("Contenido no encontrado");

        // 1. Eliminar el archivo antiguo si existe
        if (!string.IsNullOrEmpty(entity.Contenido))
        {
            await _fileStorageService.DeleteFileAsync(entity.Contenido, cancellationToken);
        }

        // 2. Guardar el nuevo archivo
        var newFileName = await _fileStorageService.SaveFileAsync(
            request.UpdateDto.Contenido, 
            "contenido-malla", 
            cancellationToken);

        // 3. Actualizar la entidad con el nuevo path
        entity.Contenido = newFileName;
        entity.EsActivo = request.UpdateDto.EsActivo;

        await _repository.UpdateAsync(entity, cancellationToken);
        return await Handle(new GetContenidoMallaByIdQuery(request.Id), cancellationToken);
    }

    public async Task<bool> Handle(DeleteContenidoMallaCommand request, CancellationToken cancellationToken)
    {
        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }

    private static ContenidoMallaDTO MapToDTO(ContenidoMalla entity)
    {
        return new ContenidoMallaDTO
        {
            IdContenidoMalla = entity.IdContenidoMalla,
            IdDetalleMalla = entity.IdDetalleMalla,
            Contenido = entity.Contenido,
            FechaRegistro = entity.FechaRegistro,
            EsActivo = entity.EsActivo,
            NombreMateria = entity.IdDetalleMallaNavigation?.IdMateriaNavigation?.Detalle ?? string.Empty
        };
    }
}
