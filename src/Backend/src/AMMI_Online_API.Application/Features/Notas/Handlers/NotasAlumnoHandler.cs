using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Notas;
using AMMI_Online_API.Application.Features.Notas.Commands;
using AMMI_Online_API.Application.Features.Notas.Queries;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Notas;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Domain.Interfaces.Distributive;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Notas.Handlers;

public class NotasAlumnoHandler :
    IRequestHandler<CreateNotaAlumnoCommand, Response<int>>,
    IRequestHandler<UpdateNotaAlumnoCommand, Response<bool>>,
    IRequestHandler<DeleteNotaAlumnoCommand, Response<bool>>,
    IRequestHandler<CreateNotasMasivasCommand, Response<bool>>,
    IRequestHandler<RecalcularNotasCommand, Response<bool>>,
    IRequestHandler<GetNotaAlumnoByIdQuery, Response<NotasAlumnoDTO>>,
    IRequestHandler<GetNotasByMatriculaQuery, Response<IEnumerable<NotasAlumnoDTO>>>,
    IRequestHandler<GetNotasByMatriculaAndPlantillaQuery, Response<IEnumerable<NotasAlumnoDTO>>>,
    IRequestHandler<GetBoletinQuery, Response<BoletinAlumnoDTO>>,
    IRequestHandler<GetNotasByMallaParaleloAndEstructuraQuery, Response<IEnumerable<NotaAlumnoParaleloDTO>>>,
    IRequestHandler<GetNotasByDetalleMatriculaQuery, Response<IEnumerable<NotasAlumnoDTO>>>,
    IRequestHandler<GetNotasByMatriculaYMateriaQuery, Response<IEnumerable<NotasAlumnoDTO>>>,
    IRequestHandler<GetNotasByParaleloQuery, Response<IEnumerable<NotasAlumnoDTO>>>,
    IRequestHandler<GetActasParaleloQuery, Response<IEnumerable<ActaAlumnoDTO>>>
{
    private readonly INotasAlumnoRepository _repository;
    private readonly INotasCalculoService _calculoService;
    private readonly IPlantillaEstructuraRepository _plantillaRepo;
    private readonly IMatriculaRepository _matriculaRepo;
    private readonly IParalelo _paraleloRepo;
    private readonly IDetalleMallaRepository _detalleMallaRepo;
    private readonly IDistributivoRepository _distributivoRepo;
    private readonly IReglasCalculoRepository _reglasRepo;
    private readonly IMallaParaleloRepository _mallaParaleloRepo;
    private readonly IGradeDeadlineService _deadlineService;

    public NotasAlumnoHandler(
        INotasAlumnoRepository repository,
        INotasCalculoService calculoService,
        IPlantillaEstructuraRepository plantillaRepo,
        IMatriculaRepository matriculaRepo,
        IParalelo paraleloRepo,
        IDetalleMallaRepository detalleMallaRepo,
        IDistributivoRepository distributivoRepo,
        IReglasCalculoRepository reglasRepo,
        IMallaParaleloRepository mallaParaleloRepo,
        IGradeDeadlineService deadlineService)
    {
        _repository = repository;
        _calculoService = calculoService;
        _plantillaRepo = plantillaRepo;
        _matriculaRepo = matriculaRepo;
        _paraleloRepo = paraleloRepo;
        _detalleMallaRepo = detalleMallaRepo;
        _distributivoRepo = distributivoRepo;
        _reglasRepo = reglasRepo;
        _mallaParaleloRepo = mallaParaleloRepo;
        _deadlineService = deadlineService;
    }

    private async Task<DetalleMalla?> GetDetalleMallaFromNota(int idDetalleMatricula, CancellationToken ct)
    {
        var detalleMatricula = await _matriculaRepo.GetDetalleMatriculaByIdAsync(idDetalleMatricula, ct);
        return detalleMatricula?.IdDetalleMallaNavigation;
    }

    public async Task<Response<IEnumerable<NotaAlumnoParaleloDTO>>> Handle(GetNotasByMallaParaleloAndEstructuraQuery request, CancellationToken ct)
    {
        // 1. Get all students in parallel
        var matriculas = await _matriculaRepo.GetByMallaParaleloAsync(request.IdMallaParalelo, ct);
        
        // 2. Get existing notes
        var notas = await _repository.GetByMallaParaleloAndEstructuraAsync(request.IdMallaParalelo, request.IdPlantillaEstructura, ct);
        
        // 3. Merge
        var result = matriculas.Select(m => {
            var nota = notas.FirstOrDefault(n => n.IdDetaleMatriculaNavigation?.IdMatricula == m.IdMatricula);
            var persona = m.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;
            
            return new NotaAlumnoParaleloDTO
            {
                IdMatricula = m.IdMatricula,
                NombreAlumno = persona != null
                    ? string.Join(" ", new[] { persona.PrimerApellido, persona.SegundoApellido, persona.PrimerNombre, persona.SegundoNombre }.Where(s => !string.IsNullOrWhiteSpace(s))).Trim()
                    : "Sin Nombre",
                NumeroDocumento = persona?.Documento ?? string.Empty,
                ValorNota = nota?.ValorNota,
                Observacion = nota?.Observacion,
                IdNotasAlumno = nota?.IdNotasAlumno
            };
        }).OrderBy(x => x.NombreAlumno);

        return Response<IEnumerable<NotaAlumnoParaleloDTO>>.Success(result, "Notas del paralelo listadas");
    }

    public async Task<Response<int>> Handle(CreateNotaAlumnoCommand request, CancellationToken ct)
    {
        // Validar rango
        if (request.ValorNota < 0 || request.ValorNota > 10)
            return Response<int>.Failure("La nota debe estar entre 0 y 10");

        // Validar que es hoja
        var hijos = await _plantillaRepo.GetHijosAsync(request.IdPlantillaEstructura, ct);
        if (hijos.Any())
            return Response<int>.Failure("No se puede asignar nota a un componente calculado (debe ser hoja)");

        var dm = await GetDetalleMallaFromNota(request.IdDetalleMatricula, ct);
        if (!_deadlineService.CanSubmitGrades(dm?.FechaInicio, dm?.FechaFin, dm?.DiasGracia))
            return Response<int>.Failure(_deadlineService.GetStatusMessage(dm?.FechaInicio, dm?.FechaFin, dm?.DiasGracia));

        if (await _repository.ExisteNotaAsync(request.IdDetalleMatricula, request.IdPlantillaEstructura, ct))
        {
            await _repository.UpsertAsync(request.IdPlantillaEstructura, request.IdDetalleMatricula, request.ValorNota, request.Observacion, ct);
            await _calculoService.PropagarCalculoAsync(request.IdPlantillaEstructura, request.IdDetalleMatricula, ct);
            var updated = await _repository.GetNotaByDetalleMatriculaAsync(request.IdPlantillaEstructura, request.IdDetalleMatricula, ct);
            return Response<int>.Success(updated?.IdNotasAlumno ?? 0, "Nota actualizada exitosamente");
        }

        var entity = new NotasAlumno
        {
            IdDetaleMatricula = request.IdDetalleMatricula,
            IdPlantillaEstructura = request.IdPlantillaEstructura,
            ValorNota = request.ValorNota,
            Observacion = request.Observacion ?? string.Empty
        };

        await _repository.AddAsync(entity, ct);
        await _calculoService.PropagarCalculoAsync(request.IdPlantillaEstructura, request.IdDetalleMatricula, ct);

        return Response<int>.Success(entity.IdNotasAlumno, "Nota registrada exitosamente");
    }

    public async Task<Response<bool>> Handle(UpdateNotaAlumnoCommand request, CancellationToken ct)
    {
        if (request.ValorNota < 0 || request.ValorNota > 10)
            return Response<bool>.Failure("La nota debe estar entre 0 y 10");

        var entity = await _repository.GetByIdAsync(request.IdNotasAlumno, ct);
        if (entity == null) return Response<bool>.Failure("Nota no encontrada");

        var dm = await GetDetalleMallaFromNota(entity.IdDetaleMatricula, ct);
        if (!_deadlineService.CanSubmitGrades(dm?.FechaInicio, dm?.FechaFin, dm?.DiasGracia))
            return Response<bool>.Failure(_deadlineService.GetStatusMessage(dm?.FechaInicio, dm?.FechaFin, dm?.DiasGracia));

        entity.ValorNota = request.ValorNota;
        entity.Observacion = request.Observacion;

        await _repository.UpdateAsync(entity, ct);

        // Propagar
        await _calculoService.PropagarCalculoAsync(entity.IdPlantillaEstructura, entity.IdDetaleMatricula, ct);

        return Response<bool>.Success(true, "Nota actualizada");
    }

    public async Task<Response<bool>> Handle(DeleteNotaAlumnoCommand request, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(request.IdNotasAlumno, ct);
        if (entity == null) return Response<bool>.Failure("Nota no encontrada");

        var dm = await GetDetalleMallaFromNota(entity.IdDetaleMatricula, ct);
        if (!_deadlineService.CanSubmitGrades(dm?.FechaInicio, dm?.FechaFin, dm?.DiasGracia))
            return Response<bool>.Failure(_deadlineService.GetStatusMessage(dm?.FechaInicio, dm?.FechaFin, dm?.DiasGracia));

        // Guardar datos para propagacion antes de borrar
        int idPlantilla = entity.IdPlantillaEstructura;
        int idDetalleMatricula = entity.IdDetaleMatricula;

        await _repository.DeleteAsync(request.IdNotasAlumno, ct);
        
        // Propagar
        await _calculoService.PropagarCalculoAsync(idPlantilla, idDetalleMatricula, ct);

        return Response<bool>.Success(true, "Nota eliminada");
    }

    public async Task<Response<bool>> Handle(CreateNotasMasivasCommand request, CancellationToken ct)
    {
        // Validar hoja
        var hijos = await _plantillaRepo.GetHijosAsync(request.Data.IdPlantillaEstructura, ct);
        if (hijos.Any())
            return Response<bool>.Failure("No se puede asignar nota masiva a componente calculado");

        if (request.Data.Notas.Any())
        {
            var firstItem = request.Data.Notas.First();
            var dm = await GetDetalleMallaFromNota(firstItem.IdDetalleMatricula, ct);
            if (!_deadlineService.CanSubmitGrades(dm?.FechaInicio, dm?.FechaFin, dm?.DiasGracia))
                return Response<bool>.Failure(_deadlineService.GetStatusMessage(dm?.FechaInicio, dm?.FechaFin, dm?.DiasGracia));
        }

        // Paso 1: Insertar/actualizar todas las notas primero
        foreach (var item in request.Data.Notas)
        {
            await _repository.UpsertAsync(request.Data.IdPlantillaEstructura, item.IdDetalleMatricula, item.ValorNota, item.Observacion, ct);
        }

        // Paso 2: Propagar cálculo una sola vez por alumno (no por nodo)
        foreach (var item in request.Data.Notas)
        {
            await _calculoService.PropagarCalculoAsync(request.Data.IdPlantillaEstructura, item.IdDetalleMatricula, ct);
        }

        return Response<bool>.Success(true, "Notas registradas");
    }

    public async Task<Response<bool>> Handle(RecalcularNotasCommand request, CancellationToken ct)
    {
        await _calculoService.RecalcularTodasAsync(request.IdDetalleMatricula, ct);
        return Response<bool>.Success(true, "Recalculo completado");
    }

    public async Task<Response<NotasAlumnoDTO>> Handle(GetNotaAlumnoByIdQuery request, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(request.Id, ct);
        if (entity == null) return Response<NotasAlumnoDTO>.Failure("Nota no encontrada");
        return Response<NotasAlumnoDTO>.Success(MapToDTO(entity), "Nota encontrada");
    }

    public async Task<Response<IEnumerable<NotasAlumnoDTO>>> Handle(GetNotasByMatriculaQuery request, CancellationToken ct)
    {
        var list = await _repository.GetByMatriculaAsync(request.IdMatricula, ct);
        return Response<IEnumerable<NotasAlumnoDTO>>.Success(list.Select(MapToDTO), "Notas encontradas");
    }

    public async Task<Response<IEnumerable<NotasAlumnoDTO>>> Handle(GetNotasByMatriculaAndPlantillaQuery request, CancellationToken ct)
    {
        var list = await _repository.GetByMatriculaAndPlantillaAsync(request.IdMatricula, request.IdPlantillaEvaluacion, ct);
        return Response<IEnumerable<NotasAlumnoDTO>>.Success(list.Select(MapToDTO), "Notas encontradas");
    }
    
    // NUEVO
    public async Task<Response<IEnumerable<NotasAlumnoDTO>>> Handle(GetNotasByDetalleMatriculaQuery request, CancellationToken ct)
    {
        var list = await _repository.GetByDetalleMatriculaAsync(request.IdDetalleMatricula, ct);
        return Response<IEnumerable<NotasAlumnoDTO>>.Success(list.Select(MapToDTO), "Notas obtenidas");
    }

    // NUEVO
    public async Task<Response<IEnumerable<NotasAlumnoDTO>>> Handle(GetNotasByMatriculaYMateriaQuery request, CancellationToken ct)
    {
        var list = await _repository.GetByMatriculaYMateriaAsync(request.IdMatricula, request.IdDetalleMalla, ct);
        return Response<IEnumerable<NotasAlumnoDTO>>.Success(list.Select(MapToDTO), "Notas obtenidas");
    }

    public async Task<Response<BoletinAlumnoDTO>> Handle(GetBoletinQuery request, CancellationToken ct)
    {
        var boletin = await _calculoService.GetBoletinAsync(request.IdMatricula, ct);
        return Response<BoletinAlumnoDTO>.Success(boletin, "Boletin generado");
    }

    private static NotasAlumnoDTO MapToDTO(NotasAlumno entity) => new()
    {
        IdNotasAlumno         = entity.IdNotasAlumno,
        IdDetalleMatricula    = entity.IdDetaleMatricula,
        IdPlantillaEstructura = entity.IdPlantillaEstructura,
        ValorNota             = entity.ValorNota,
        Observacion           = entity.Observacion,
        NombreComponente      = entity.IdPlantillaEstructuraNavigation?.NodoNombre ?? string.Empty,
        PesoComponente        = entity.IdPlantillaEstructuraNavigation?.Peso ?? 0,
        IdMatricula           = entity.IdDetaleMatriculaNavigation?.IdMatricula,
        NombreMateria         = entity.IdDetaleMatriculaNavigation?.IdDetalleMallaNavigation?.IdMateriaNavigation?.Detalle ?? string.Empty,
        ExamenRemedial        = entity.IdDetaleMatriculaNavigation?.ExamenRemedial
    };

    public async Task<Response<IEnumerable<NotasAlumnoDTO>>> Handle(GetNotasByParaleloQuery request, CancellationToken ct)
    {
        var notas = await _repository.GetByParaleloAsync(request.IdMallaParalelo, request.IdDetalleMatricula, request.IdDetalleMalla, request.IdMatricula, ct);
        return Response<IEnumerable<NotasAlumnoDTO>>.Success(notas.Select(MapToDTO), "Notas del paralelo obtenidas correctamente");
    }

    public async Task<Response<IEnumerable<ActaAlumnoDTO>>> Handle(GetActasParaleloQuery request, CancellationToken ct)
    {
        var matriculas = await _matriculaRepo.GetByMallaParaleloAsync(request.IdMallaParalelo, ct);

        var actas = new List<ActaAlumnoDTO>();

        foreach (var m in matriculas)
        {
            var persona = m.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;
            var nombreAlumno = persona != null
                ? string.Join(" ", new[] { persona.PrimerApellido, persona.SegundoApellido, persona.PrimerNombre, persona.SegundoNombre }.Where(s => !string.IsNullOrWhiteSpace(s))).Trim()
                : "Sin Nombre";
            var documento = persona?.Documento ?? string.Empty;

            var detalles = m.DetalleMatricula
                .Where(dm => !request.IdDetalleMalla.HasValue || dm.IdDetalleMalla == request.IdDetalleMalla.Value)
                .ToList();

            foreach (var dm in detalles)
            {
                var estado = dm.Aprobado == true ? "Aprobado"
                           : dm.Aprobado == false ? "Reprobado"
                           : "Pendiente";

                actas.Add(new ActaAlumnoDTO
                {
                    NombreAlumno      = nombreAlumno,
                    NumeroDocumento   = documento,
                    IdDetalleMatricula = dm.IdDetalleMatricula,
                    NotaFinal         = dm.NotaFinal,
                    ExamenRemedial    = dm.ExamenRemedial,
                    Aprobado          = dm.Aprobado,
                    Estado            = estado
                });
            }
        }

        return Response<IEnumerable<ActaAlumnoDTO>>.Success(
            actas.OrderBy(a => a.NombreAlumno),
            "Actas del paralelo obtenidas correctamente");
    }
}
