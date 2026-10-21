using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Handlers;

public class MallaRequisitosHandler :
    IRequestHandler<GetMallaRequisitosByIdQuery, MallaRequisitosDTO?>,
    IRequestHandler<GetRequistosByMallaIdQuery, IEnumerable<MallaRequisitosDTO>>,
    IRequestHandler<GetMallasByRequisitoIdQuery, IEnumerable<MallaRequisitosDTO>>,
    IRequestHandler<GetAllMallaRequisitosQuery, IEnumerable<MallaRequisitosDTO>>,
    IRequestHandler<CreateMallaRequisitosCommand, MallaRequisitosDTO>,
    IRequestHandler<AsignarRequisitosAMallaCommand, IEnumerable<MallaRequisitosDTO>>,
    IRequestHandler<ReemplazarRequisitosCommand, IEnumerable<MallaRequisitosDTO>>,
    IRequestHandler<DeleteMallaRequisitosCommand, bool>,
    IRequestHandler<DeleteRequisitosDemallaCommand, bool>
{
    private readonly IMallaRequisitosRepository _repository;
    private readonly IInfraestructuraValidationService _validationService;

    public MallaRequisitosHandler(IMallaRequisitosRepository repository, IInfraestructuraValidationService validationService)
    {
        _repository = repository;
        _validationService = validationService;
    }

    #region Queries

    public async Task<MallaRequisitosDTO?> Handle(GetMallaRequisitosByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        return entity == null ? null : MapToDTO(entity);
    }

    public async Task<IEnumerable<MallaRequisitosDTO>> Handle(GetRequistosByMallaIdQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByMallaIdAsync(request.IdMalla, cancellationToken);
        return entities.Select(MapToDTO);
    }

    public async Task<IEnumerable<MallaRequisitosDTO>> Handle(GetMallasByRequisitoIdQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByRequisitoIdAsync(request.IdRequisito, cancellationToken);
        return entities.Select(MapToDTO);
    }

    public async Task<IEnumerable<MallaRequisitosDTO>> Handle(GetAllMallaRequisitosQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);
        return entities.Select(MapToDTO);
    }

    #endregion

    #region Commands

    public async Task<MallaRequisitosDTO> Handle(CreateMallaRequisitosCommand request, CancellationToken cancellationToken)
    {
        var (esValido, mensaje) = await _validationService
            .ValidarMallaSinMatriculadosAsync(request.CreateDto.IdMalla, cancellationToken);
        if (!esValido)
            throw new InvalidOperationException(mensaje);

        // Verificar que no exista la relacion
        if (await _repository.ExistsAsync(request.CreateDto.IdMalla, request.CreateDto.IdRequisitos, cancellationToken))
        {
            throw new InvalidOperationException("El requisito ya esta asignado a esta malla.");
        }

        var entity = new MallaRequisitos
        {
            IdMalla = request.CreateDto.IdMalla,
            IdRequisitos = request.CreateDto.IdRequisitos
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        // Obtener con includes para retornar datos completos
        var result = await _repository.GetByIdAsync(created.IdMallaRequisitos, cancellationToken);
        return MapToDTO(result!);
    }

    public async Task<IEnumerable<MallaRequisitosDTO>> Handle(AsignarRequisitosAMallaCommand request, CancellationToken cancellationToken)
    {
        var (esValido, mensaje) = await _validationService
            .ValidarMallaSinMatriculadosAsync(request.AsignarDto.IdMalla, cancellationToken);
        if (!esValido)
            throw new InvalidOperationException(mensaje);

        var entitesToAdd = new List<MallaRequisitos>();

        foreach (var idRequisito in request.AsignarDto.IdsRequisitos)
        {
            // Solo agregar si no existe
            if (!await _repository.ExistsAsync(request.AsignarDto.IdMalla, idRequisito, cancellationToken))
            {
                entitesToAdd.Add(new MallaRequisitos
                {
                    IdMalla = request.AsignarDto.IdMalla,
                    IdRequisitos = idRequisito
                });
            }
        }

        if (entitesToAdd.Any())
        {
            await _repository.AddRangeAsync(entitesToAdd, cancellationToken);
        }

        // Retornar todos los requisitos de la malla
        return await Handle(new GetRequistosByMallaIdQuery(request.AsignarDto.IdMalla), cancellationToken);
    }

    public async Task<IEnumerable<MallaRequisitosDTO>> Handle(ReemplazarRequisitosCommand request, CancellationToken cancellationToken)
    {
        var (esValido, mensaje) = await _validationService
            .ValidarMallaSinMatriculadosAsync(request.ReemplazarDto.IdMalla, cancellationToken);
        if (!esValido)
            throw new InvalidOperationException(mensaje);

        // Eliminar todos los requisitos actuales de la malla
        await _repository.DeleteByMallaIdAsync(request.ReemplazarDto.IdMalla, cancellationToken);

        // Agregar los nuevos requisitos
        var entitiesToAdd = request.ReemplazarDto.IdsRequisitos
            .Distinct()
            .Select(idRequisito => new MallaRequisitos
            {
                IdMalla = request.ReemplazarDto.IdMalla,
                IdRequisitos = idRequisito
            })
            .ToList();

        if (entitiesToAdd.Any())
        {
            await _repository.AddRangeAsync(entitiesToAdd, cancellationToken);
        }

        // Retornar todos los requisitos de la malla
        return await Handle(new GetRequistosByMallaIdQuery(request.ReemplazarDto.IdMalla), cancellationToken);
    }

    public async Task<bool> Handle(DeleteMallaRequisitosCommand request, CancellationToken cancellationToken)
    {
        // Obtener la entidad para conocer el IdMalla
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null) throw new KeyNotFoundException("MallaRequisitos no encontrado.");

        var (esValido, mensaje) = await _validationService
            .ValidarMallaSinMatriculadosAsync(entity.IdMalla, cancellationToken);
        if (!esValido)
            throw new InvalidOperationException(mensaje);

        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }

    public async Task<bool> Handle(DeleteRequisitosDemallaCommand request, CancellationToken cancellationToken)
    {
        var (esValido, mensaje) = await _validationService
            .ValidarMallaSinMatriculadosAsync(request.IdMalla, cancellationToken);
        if (!esValido)
            throw new InvalidOperationException(mensaje);

        return await _repository.DeleteByMallaIdAsync(request.IdMalla, cancellationToken);
    }

    #endregion

    #region Mapping

    private static MallaRequisitosDTO MapToDTO(MallaRequisitos entity)
    {
        return new MallaRequisitosDTO
        {
            IdMallaRequisitos = entity.IdMallaRequisitos,
            IdMalla = entity.IdMalla,
            IdRequisitos = entity.IdRequisitos,
            DetalleMalla = entity.IdMallaNavigation?.Detalle ?? string.Empty,
            DetalleRequisito = entity.IdRequisitosNavigation?.Detalle ?? string.Empty,
            EsObligatorio = entity.IdRequisitosNavigation?.EsObligatorio ?? false,
            BloqueaInscripcion = entity.IdRequisitosNavigation?.BloqueaInscripcion ?? false,
            TipoDato = entity.IdRequisitosNavigation?.TipoDato ?? string.Empty,
            EsMayorEdad = entity.IdRequisitosNavigation?.EsMayorEdad ?? false
        };
    }

    #endregion
}
