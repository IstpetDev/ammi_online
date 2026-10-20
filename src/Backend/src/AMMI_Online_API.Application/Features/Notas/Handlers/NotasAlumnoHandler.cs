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
    IRequestHandler<GetNotasByParaleloAndEstructuraQuery, Response<IEnumerable<NotaAlumnoParaleloDTO>>>,
    IRequestHandler<GetResumenNotasParaleloQuery, Response<ResumenNotasParaleloDTO>>,
    IRequestHandler<GetNotasByDetalleMatriculaQuery, Response<IEnumerable<NotasAlumnoDTO>>>,
    IRequestHandler<GetNotasByMatriculaYMateriaQuery, Response<IEnumerable<NotasAlumnoDTO>>>
{
    private readonly INotasAlumnoRepository _repository;
    private readonly INotasCalculoService _calculoService;
    private readonly IPlantillaEstructuraRepository _plantillaRepo;
    private readonly IMatriculaRepository _matriculaRepo;
    private readonly IParalelo _paraleloRepo;
    private readonly IDetalleMallaRepository _detalleMallaRepo;
    private readonly IDistributivoRepository _distributivoRepo;
    private readonly IReglasCalculoRepository _reglasRepo;

    public NotasAlumnoHandler(
        INotasAlumnoRepository repository,
        INotasCalculoService calculoService,
        IPlantillaEstructuraRepository plantillaRepo,
        IMatriculaRepository matriculaRepo,
        IParalelo paraleloRepo,
        IDetalleMallaRepository detalleMallaRepo,
        IDistributivoRepository distributivoRepo,
        IReglasCalculoRepository reglasRepo)
    {
        _repository = repository;
        _calculoService = calculoService;
        _plantillaRepo = plantillaRepo;
        _matriculaRepo = matriculaRepo;
        _paraleloRepo = paraleloRepo;
        _detalleMallaRepo = detalleMallaRepo;
        _distributivoRepo = distributivoRepo;
        _reglasRepo = reglasRepo;
    }

    public async Task<Response<IEnumerable<NotaAlumnoParaleloDTO>>> Handle(GetNotasByParaleloAndEstructuraQuery request, CancellationToken ct)
    {
        // 1. Get all students in parallel
        var matriculas = await _matriculaRepo.GetByParaleloAsync(request.IdParalelo, ct);
        
        // 2. Get existing notes
        var notas = await _repository.GetByParaleloAndEstructuraAsync(request.IdParalelo, request.IdPlantillaEstructura, ct);
        
        // 3. Merge
        var result = matriculas.Select(m => {
            var nota = notas.FirstOrDefault(n => n.IdDetaleMatriculaNavigation?.IdMatricula == m.IdMatricula);
            var persona = m.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;
            
            return new NotaAlumnoParaleloDTO
            {
                IdMatricula = m.IdMatricula,
                NombreAlumno = persona != null ? $"{persona.PrimerApellido} {persona.PrimerNombre}" : "Sin Nombre",
                NumeroDocumento = persona?.Documento ?? string.Empty,
                ValorNota = nota?.ValorNota,
                Observacion = nota?.Observacion,
                IdNotasAlumno = nota?.IdNotasAlumno
            };
        }).OrderBy(x => x.NombreAlumno);

        return Response<IEnumerable<NotaAlumnoParaleloDTO>>.Success(result, "Notas del paralelo listadas");
    }

    public async Task<Response<ResumenNotasParaleloDTO>> Handle(GetResumenNotasParaleloQuery request, CancellationToken ct)
    {
        // 1. Obtener información del paralelo
        var paralelo = await _paraleloRepo.GetByIdAsync(request.IdParalelo, ct);
        if (paralelo == null)
            return Response<ResumenNotasParaleloDTO>.Failure("Paralelo no encontrado");

        // 2. Obtener información del detalle de malla (materia)
        var detalleMalla = await _detalleMallaRepo.GetByIdAsync(request.IdDetalleMalla, ct);
        if (detalleMalla == null)
            return Response<ResumenNotasParaleloDTO>.Failure("Detalle de malla no encontrado");

        var nombreMateria = detalleMalla.IdMateriaNavigation?.Detalle ?? "Sin nombre";

        // 3. Obtener el docente del distributivo (paralelo + detalle malla)
        var distributivos = await _distributivoRepo.GetByDetalleMallaAsync(request.IdDetalleMalla, ct);
        var distributivo = distributivos.FirstOrDefault(d => d.IdParalelo == request.IdParalelo);
        var nombreDocente = "Sin asignar";
        if (distributivo?.IdPersonaNavigation?.IdPersonaNavigation != null)
        {
            var persona = distributivo.IdPersonaNavigation.IdPersonaNavigation;
            nombreDocente = $"{persona.PrimerApellido} {persona.PrimerNombre}";
        }

        // 4. Obtener todas las matrículas del paralelo
        var matriculas = await _matriculaRepo.GetByParaleloAsync(request.IdParalelo, ct);
        var totalAlumnos = matriculas.Count();

        // 5. Obtener el nodo raíz de la plantilla de evaluación para calcular nota final
        var idPlantillaEvaluacion = detalleMalla.IdPlantillaEvaluacion;
        var estructuras = await _plantillaRepo.GetByPlantillaIdAsync(idPlantillaEvaluacion, ct);
        var nodoRaiz = estructuras.FirstOrDefault(e => e.IdNodoPadre == null);

        if (nodoRaiz == null)
        {
            return Response<ResumenNotasParaleloDTO>.Success(new ResumenNotasParaleloDTO
            {
                IdParalelo = request.IdParalelo,
                NombreParalelo = paralelo.NombreParalelo,
                IdDetalleMalla = request.IdDetalleMalla,
                NombreMateria = nombreMateria,
                NombreDocente = nombreDocente,
                TotalAlumnos = totalAlumnos,
                AlumnosConNotas = 0,
                AlumnosAprobados = 0,
                AlumnosReprobados = 0,
                AlumnosPendientes = totalAlumnos,
                PromedioGeneral = 0,
                NotaMaxima = 0,
                NotaMinima = 0
            }, "Resumen generado (sin estructura de evaluación)");
        }

        // 6. Obtener las notas finales (nodo raíz) PARA ESTA MATERIA (filtrando por DetalleMalla indirectamente)
        // La implementacion antigua GetByPlantillaEstructuraAsync traia TODAS las notas de ese nodo estructura.
        // Pero ahora IdPlantillaEstructura pertenece a NotasAlumno, que tiene IdDetalleMatricula, que tiene IdDetalleMalla.
        // Como IdPlantillaEstructura pertenece a un IdPlantillaEvaluacion especifico, y IdPlantillaEvaluacion esta ligado a DetalleMalla,
        // al filtrar por IdPlantillaEstructura YA estamos filtrando por "Tipo de Evaluacion".
        // SIN EMBARGO, si mismo IdPlantillaEvaluacion se usa en VARIAS materias (reuso de plantilla),
        // NotasAlumno tendria notas de multiples materias para el mismo alumno.
        // AQUI ESTA EL ERROR DE DISEÑO ORIGINAL QUE ESTAMOS CORRIGIENDO.
        
        // Usamos GetByParaleloAndDetalleMallaAsync que ya filtra correctamente
        var notasMateriaParalelo = await _repository.GetByParaleloAndDetalleMallaAsync(request.IdParalelo, request.IdDetalleMalla, ct);
        
        // Filtramos solo las que corresponden al nodo raiz
        var notasRaiz = notasMateriaParalelo.Where(n => n.IdPlantillaEstructura == nodoRaiz.IdPlantillaEstructura).ToList();

        var alumnosConNotas = notasRaiz.Count; // Assuming distinct per student
        var alumnosPendientes = totalAlumnos - alumnosConNotas;

        var reglaRaiz = nodoRaiz != null
            ? await _reglasRepo.GetByPlantillaEstructuraAsync(nodoRaiz.IdPlantillaEstructura, ct)
            : null;
        var notaAprobatoria = reglaRaiz?.NotaMinimaAprobar ?? 7.0m;
        var alumnosAprobados = notasRaiz.Count(n => n.ValorNota >= notaAprobatoria);
        var alumnosReprobados = notasRaiz.Count(n => n.ValorNota < notaAprobatoria);

        var promedioGeneral = notasRaiz.Any()
            ? Math.Round(notasRaiz.Average(n => n.ValorNota ?? 0), 2)
            : 0m;
        var notaMaxima = notasRaiz.Any()
            ? notasRaiz.Max(n => n.ValorNota ?? 0)
            : 0m;
        var notaMinima = notasRaiz.Any()
            ? notasRaiz.Min(n => n.ValorNota ?? 0)
            : 0m;

        return Response<ResumenNotasParaleloDTO>.Success(new ResumenNotasParaleloDTO
        {
            IdParalelo = request.IdParalelo,
            NombreParalelo = paralelo.NombreParalelo,
            IdDetalleMalla = request.IdDetalleMalla,
            NombreMateria = nombreMateria,
            NombreDocente = nombreDocente,
            TotalAlumnos = totalAlumnos,
            AlumnosConNotas = alumnosConNotas,
            AlumnosAprobados = alumnosAprobados,
            AlumnosReprobados = alumnosReprobados,
            AlumnosPendientes = alumnosPendientes,
            PromedioGeneral = promedioGeneral,
            NotaMaxima = notaMaxima,
            NotaMinima = notaMinima
        }, "Resumen generado exitosamente");
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
        
        // Optimization: Get all IdMatriculas needed
        var idsDetalle = request.Data.Notas.Select(n => n.IdDetalleMatricula).Distinct().ToList();
        
        foreach(var item in request.Data.Notas)
        {
             await _repository.UpsertAsync(request.Data.IdPlantillaEstructura, item.IdDetalleMatricula, item.ValorNota, item.Observacion, ct);
             
             // Propagate one by one... SLOW but correct
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

    private static NotasAlumnoDTO MapToDTO(NotasAlumno entity)
    {
         return new NotasAlumnoDTO
        {
            IdNotasAlumno = entity.IdNotasAlumno,
            IdDetalleMatricula = entity.IdDetaleMatricula,
            IdPlantillaEstructura = entity.IdPlantillaEstructura,
            ValorNota = entity.ValorNota,
            Observacion = entity.Observacion,
            NombreComponente = entity.IdPlantillaEstructuraNavigation?.NodoNombre ?? string.Empty,
            PesoComponente = entity.IdPlantillaEstructuraNavigation?.Peso ?? 0,
            
            // Datos derivados seguros
            IdMatricula = entity.IdDetaleMatriculaNavigation?.IdMatricula,
            NombreMateria = entity.IdDetaleMatriculaNavigation?.IdDetalleMallaNavigation?.IdMateriaNavigation?.Detalle ?? string.Empty
        };
    }
}
