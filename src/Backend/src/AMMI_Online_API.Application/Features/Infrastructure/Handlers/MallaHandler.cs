using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Handlers;

public class MallaHandler :
    IRequestHandler<GetAllMallasQuery, PaginatedResult<MallaDTO>>,
    IRequestHandler<GetMallaByIdQuery, MallaDTO?>,
    IRequestHandler<GetMallasByCicloIdQuery, IEnumerable<MallaDTO>>,
    IRequestHandler<CreateMallaCommand, MallaDTO>,
    IRequestHandler<UpdateMallaCommand, MallaDTO>,
    IRequestHandler<DeleteMallaCommand, bool>,
    IRequestHandler<GetMallaByTipoOfertaWithActiveCicloQuery, IEnumerable<MallaDTO>>,
    IRequestHandler<GetConfiguracionCursosQuery, IEnumerable<CursoConfigStatusDTO>>
{
    private readonly IMallaRepository _repository;
    private readonly IInfraestructuraValidationService _validationService;
    private readonly ICurso _cursoRepo;

    public MallaHandler(IMallaRepository repository, IInfraestructuraValidationService validationService, ICurso cursoRepo)
    {
        _repository = repository;
        _validationService = validationService;
        _cursoRepo = cursoRepo;
    }

    private static MallaDTO MapToDTO(Malla e)
    {
        return new MallaDTO
        {
            IdMalla = e.IdMalla,
            Detalle = e.Detalle,
            IdCursos = e.IdCursos,
            IdCiclo = e.IdCiclo,
            NombreCurso = e.IdCursosNavigation?.Detalle ?? string.Empty,
            NombreTipoOferta = e.IdCicloNavigation?.IdTipoOfertaNavigation?.Detalle ?? string.Empty,
            DetalleCiclo = e.IdCicloNavigation?.Detalle ?? string.Empty,
            OrdenCurso = e.IdCursosNavigation?.Orden,
            CicloEsActivo = e.IdCicloNavigation?.EsActivo ?? false,
            TieneDetalleMalla = e.DetalleMalla != null && e.DetalleMalla.Any()
        };
    }

    public async Task<PaginatedResult<MallaDTO>> Handle(GetAllMallasQuery request, CancellationToken cancellationToken)
    {
        var totalCount = await _repository.CountAllAsync(
            request.IdMalla, request.Detalle, request.IdCursos, request.IdCiclo, cancellationToken);

        var entities = await _repository.GetAllPagedAsync(
            request.IdMalla, request.Detalle, request.IdCursos, request.IdCiclo,
            request.PageNumber, request.PageSize, cancellationToken);

        return new PaginatedResult<MallaDTO>(entities.Select(MapToDTO), totalCount, request.PageNumber, request.PageSize);
    }

    public async Task<MallaDTO?> Handle(GetMallaByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdWithRelationsAsync(request.IdMalla, cancellationToken);
        return entity != null ? MapToDTO(entity) : null;
    }

    public async Task<IEnumerable<MallaDTO>> Handle(GetMallasByCicloIdQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByCicloIdAsync(request.IdCiclo, cancellationToken);
        return entities.Select(MapToDTO);
    }

    public async Task<IEnumerable<MallaDTO>> Handle(GetMallaByTipoOfertaWithActiveCicloQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByTipoOfertaWithActiveCicloAsync(request.IdTipoOferta, cancellationToken);
        return entities.Select(MapToDTO);
    }

    public async Task<MallaDTO> Handle(CreateMallaCommand request, CancellationToken cancellationToken)
    {
        var entity = new Malla
        {
            Detalle = request.Malla.Detalle,
            IdCursos = request.Malla.IdCursos,
            IdCiclo = request.Malla.IdCiclo,
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return new MallaDTO
        {
            IdMalla = created.IdMalla,
            Detalle = created.Detalle,
            IdCursos = created.IdCursos,
            IdCiclo = created.IdCiclo
        };
    }

    public async Task<MallaDTO> Handle(UpdateMallaCommand request, CancellationToken cancellationToken)
    {
        var (esValido, mensaje) = await _validationService
            .ValidarMallaSinMatriculadosAsync(request.Malla.IdMalla, cancellationToken);
        if (!esValido)
            throw new InvalidOperationException(mensaje);

        var entity = new Malla
        {
            IdMalla = request.Malla.IdMalla,
            Detalle = request.Malla.Detalle,
            IdCursos = request.Malla.IdCursos,
            IdCiclo = request.Malla.IdCiclo,
        };

        var updated = await _repository.UpdateAsync(entity, cancellationToken);

        return new MallaDTO
        {
            IdMalla = updated.IdMalla,
            Detalle = updated.Detalle,
            IdCursos = updated.IdCursos,
            IdCiclo = updated.IdCiclo
        };
    }

    public async Task<bool> Handle(DeleteMallaCommand request, CancellationToken cancellationToken)
    {
        var (esValido, mensaje) = await _validationService
            .ValidarMallaSinMatriculadosAsync(request.Id, cancellationToken);
        if (!esValido)
            throw new InvalidOperationException(mensaje);

        return await _repository.DeleteAsync(request.Id, cancellationToken);
    }

    public async Task<IEnumerable<CursoConfigStatusDTO>> Handle(GetConfiguracionCursosQuery request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        // Fetch all courses filtered by especialidad (if provided)
        var courses = await _cursoRepo.FindAsync(null, req.IdEspecialidad, null, cancellationToken);

        // Fetch all mallas for this Ciclo
        var mallas = await _repository.GetMallasWithRelationsForConfiguracionAsync(req.IdCiclo, cancellationToken);
        var mallasDict = mallas.ToDictionary(m => m.IdCursos);

        var result = new List<CursoConfigStatusDTO>();
        foreach (var course in courses)
        {
            mallasDict.TryGetValue(course.IdCursos, out var malla);

            var materiasCount = malla?.DetalleMalla?.Count ?? 0;
            var requisitosCount = malla?.MallaRequisitos?.Count ?? 0;
            var paralelosCount = malla?.MallaParalelo?.Count ?? 0;
            var especiesCount = malla?.EspecieCiclo?.Count ?? 0;

            // Determine status
            string estado = "sin_configurar";
            if (malla != null)
            {
                if (materiasCount > 0 && requisitosCount > 0 && paralelosCount > 0 && especiesCount > 0)
                {
                    estado = "completo";
                }
                else
                {
                    estado = "parcial";
                }
            }

            result.Add(new CursoConfigStatusDTO
            {
                IdCurso = course.IdCursos,
                Detalle = course.Detalle,
                IdEspecialidad = course.IdEspecialidad,
                IdMalla = malla?.IdMalla,
                TieneDetalleMalla = materiasCount > 0,
                TieneRequisitos = requisitosCount > 0,
                TieneParalelos = paralelosCount > 0,
                TieneEspecies = especiesCount > 0,
                Estado = estado,
                MateriasCount = materiasCount,
                RequisitosCount = requisitosCount,
                ParalelosCount = paralelosCount,
                EspeciesCount = especiesCount
            });
        }

        return result;
    }
}
