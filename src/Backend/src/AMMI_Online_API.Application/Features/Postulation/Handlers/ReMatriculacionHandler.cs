using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

// ── GetReMatriculaInfoQuery handler ─────────────────────────────────────────

public class GetReMatriculaInfoHandler : IRequestHandler<GetReMatriculaInfoQuery, ReMatriculaInfoDTO>
{
    private readonly IReMatriculacionRepository _repo;
    private readonly ICiclo _cicloRepo;
    private readonly IPersona _personaRepo;

    public GetReMatriculaInfoHandler(IReMatriculacionRepository repo, ICiclo cicloRepo, IPersona personaRepo)
    {
        _repo = repo;
        _cicloRepo = cicloRepo;
        _personaRepo = personaRepo;
    }

    public async Task<ReMatriculaInfoDTO> Handle(GetReMatriculaInfoQuery request, CancellationToken ct)
    {
        // 0. Resolver número de documento → IdPersona
        var personas = await _personaRepo.FindAsync(
            idPersona: null, idTipoDocumento: null, Documento: request.NumeroDocumento,
            idGenero: null, primerNombre: null, segundoNombre: null,
            primerApellido: null, segundoApellido: null, activo: null,
            cancellationToken: ct);

        var persona = personas.FirstOrDefault();
        if (persona is null)
            return new ReMatriculaInfoDTO
            {
                Motivo = MotivoReMatricula.SIN_MATRICULA_PREVIA,
                MensajeDiagnostico = $"No se encontró ninguna persona con documento '{request.NumeroDocumento}'."
            };

        var idPersona = persona.IdPersona;
        var resultado = new ReMatriculaInfoDTO { IdPersona = idPersona };

        // 0.1 Verificar deudas pendientes
        var tieneDeuda = await _repo.TieneDeudasPendientesAsync(idPersona, ct);
        if (tieneDeuda)
        {
            resultado.PuedeReMatricular = false;
            resultado.Motivo = MotivoReMatricula.DEUDA_PENDIENTE;
            resultado.MensajeDiagnostico = "El alumno presenta saldos pendientes de pago de ciclos anteriores.";
            return resultado;
        }

        // 1. Obtener la última matrícula del alumno con todas sus relaciones
        var ultima = await _repo.GetUltimaMatriculaConDetallesAsync(idPersona, ct);
        if (ultima is null)
        {
            resultado.Motivo = MotivoReMatricula.SIN_MATRICULA_PREVIA;
            resultado.MensajeDiagnostico = "El alumno no tiene matrículas registradas.";
            return resultado;
        }

        resultado.IdMatriculaActual = ultima.IdMatricula;

        var malla = ultima.IdMallaParaleloNavigation?.IdMallaNavigation;
        var curso = malla?.IdCursosNavigation;

        resultado.IdMallaOrigen = malla?.IdMalla;
        resultado.DetalleMallaOrigen = malla?.Detalle;
        resultado.IdCursosOrigen = curso?.IdCursos;
        resultado.OrdenCursosOrigen = curso?.Orden;

        // 2. Verificar que el ciclo destino exista
        var cicloDestino = await _cicloRepo.GetByIdAsync(request.IdCicloDestino, ct);
        if (cicloDestino is null)
        {
            resultado.Motivo = MotivoReMatricula.MALLA_DESTINO_NO_ENCONTRADA;
            resultado.MensajeDiagnostico = $"El ciclo destino ID {request.IdCicloDestino} no existe.";
            return resultado;
        }

        // 3. Evaluar resultado académico
        var detalles = ultima.DetalleMatricula.ToList();
        if (detalles.Any(d => d.Aprobado is null))
        {
            resultado.Motivo = MotivoReMatricula.SIN_CALIFICACIONES;
            resultado.MensajeDiagnostico = "El alumno tiene materias sin calificar. No puede re-matricularse aún.";
            return resultado;
        }

        bool debeRepetir = detalles.Any(d => d.Aprobado == false);

        // 4. Determinar malla destino
        Domain.Entities.Malla? mallaDestino;

        if (debeRepetir)
        {
            mallaDestino = await _repo.GetMallaParaRepetirAsync(curso!.IdCursos, request.IdCicloDestino, ct);
        }
        else
        {
            if (curso?.Orden is null)
            {
                resultado.Motivo = MotivoReMatricula.MALLA_DESTINO_NO_ENCONTRADA;
                resultado.MensajeDiagnostico = "El curso actual no tiene Orden definido; no se puede determinar el siguiente nivel.";
                return resultado;
            }
            mallaDestino = await _repo.GetMallaParaSiguienteNivelAsync(
                curso.Orden.Value + 1, request.IdCicloDestino, ct);
        }

        if (mallaDestino is null)
        {
            resultado.Motivo = MotivoReMatricula.MALLA_DESTINO_NO_ENCONTRADA;
            resultado.MensajeDiagnostico = debeRepetir
                ? $"No existe malla para repetir (Curso ID {curso?.IdCursos}) en el ciclo destino ID {request.IdCicloDestino}."
                : $"No existe malla del siguiente nivel en el ciclo destino ID {request.IdCicloDestino}.";
            return resultado;
        }

        resultado.IdMallaDestino = mallaDestino.IdMalla;
        resultado.DetalleMallaDestino = mallaDestino.Detalle;

        // 5. Verificar si ya está matriculado en esa malla
        if (await _repo.AlumnoYaMatriculadoEnMallaAsync(idPersona, mallaDestino.IdMalla, ct))
        {
            resultado.Motivo = MotivoReMatricula.YA_MATRICULADO;
            resultado.MensajeDiagnostico = "El alumno ya tiene una matrícula activa en la malla destino.";
            return resultado;
        }

        // 6. Obtener paralelos disponibles con cupo
        var paralelos = (await _repo.GetParalelosConCupoAsync(mallaDestino.IdMalla, ct)).ToList();
        var conCupo = paralelos
            .Where(p => p.Paralelo.CupoMaximo is null || p.Matriculados < p.Paralelo.CupoMaximo)
            .ToList();

        if (conCupo.Count == 0)
        {
            resultado.Motivo = MotivoReMatricula.SIN_PARALELOS_DISPONIBLES;
            resultado.MensajeDiagnostico = "No hay paralelos con cupo disponible en la malla destino.";
            return resultado;
        }

        resultado.PuedeReMatricular = true;
        resultado.Motivo = debeRepetir ? MotivoReMatricula.REPETIR : MotivoReMatricula.AVANZAR;
        resultado.MensajeDiagnostico = debeRepetir
            ? "El alumno debe repetir la malla (reprobó al menos una materia)."
            : "El alumno puede avanzar al siguiente nivel.";

        resultado.ParalelosDisponibles = conCupo.Select(p => new ParaleloDisponibleDTO
        {
            IdMallaParalelo = p.Paralelo.IdMallaParalelo,
            DetalleParalelo = p.Paralelo.IdParaleloNavigation?.Detalle,
            CupoMaximo = p.Paralelo.CupoMaximo ?? int.MaxValue,
            Matriculados = p.Matriculados,
            CupoDisponible = p.Paralelo.CupoMaximo.HasValue
                ? p.Paralelo.CupoMaximo.Value - p.Matriculados
                : int.MaxValue
        }).ToList();

        return resultado;
    }
}

// ── ReMatricularCommand handler ──────────────────────────────────────────────

public class ReMatricularHandler : IRequestHandler<ReMatricularCommand, Response<ReMatricularResultDTO>>
{
    private readonly IReMatriculacionRepository _repo;
    private readonly IMatriculaRepository _matriculaRepo;
    private readonly IEstadoMatriculaRepository _estadoRepo;
    private readonly IGenerarMatricula _generarMatricula;
    private readonly IMallaParaleloRepository _mallaParaleloRepo;

    public ReMatricularHandler(
        IReMatriculacionRepository repo,
        IMatriculaRepository matriculaRepo,
        IEstadoMatriculaRepository estadoRepo,
        IGenerarMatricula generarMatricula,
        IMallaParaleloRepository mallaParaleloRepo)
    {
        _repo = repo;
        _matriculaRepo = matriculaRepo;
        _estadoRepo = estadoRepo;
        _generarMatricula = generarMatricula;
        _mallaParaleloRepo = mallaParaleloRepo;
    }

    public async Task<Response<ReMatricularResultDTO>> Handle(
        ReMatricularCommand request, CancellationToken ct)
    {
        // 1. Verificar matrícula previa
        var matriculaAnterior = await _repo.GetUltimaMatriculaConDetallesAsync(request.IdPersona, ct);
        if (matriculaAnterior is null)
            return Response<ReMatricularResultDTO>.Failure("El alumno no tiene matrículas previas.");

        // 1.1 Verificar deudas pendientes
        var tieneDeuda = await _repo.TieneDeudasPendientesAsync(request.IdPersona, ct);
        if (tieneDeuda)
            return Response<ReMatricularResultDTO>.Failure("El alumno presenta saldos pendientes de pago de ciclos anteriores. Solucione la deuda antes de re-matricular.");

        // 2. Verificar calificaciones completas
        if (matriculaAnterior.DetalleMatricula.Any(d => d.Aprobado is null))
            return Response<ReMatricularResultDTO>.Failure(
                "El alumno tiene materias sin calificar. Complete las calificaciones antes de re-matricular.");

        // 3. Obtener el MallaParalelo destino para extraer IdMalla
        var mallaParaleloDestino = await _mallaParaleloRepo.GetByIdAsync(request.IdMallaParalelo, ct);
        if (mallaParaleloDestino is null)
            return Response<ReMatricularResultDTO>.Failure(
                $"El paralelo de malla ID {request.IdMallaParalelo} no existe.");

        if (!mallaParaleloDestino.EsActivo)
            return Response<ReMatricularResultDTO>.Failure(
                $"El paralelo ID {request.IdMallaParalelo} no está activo.");

        // 4. Verificar que el alumno no esté ya matriculado en esa malla
        if (await _repo.AlumnoYaMatriculadoEnMallaAsync(request.IdPersona, mallaParaleloDestino.IdMalla, ct))
            return Response<ReMatricularResultDTO>.Failure(
                "El alumno ya tiene una matrícula activa en la malla destino.");

        // 5. Verificar cupo disponible
        var paralelos = (await _repo.GetParalelosConCupoAsync(mallaParaleloDestino.IdMalla, ct)).ToList();
        var paraleloElegido = paralelos.FirstOrDefault(p => p.Paralelo.IdMallaParalelo == request.IdMallaParalelo);

        if (paraleloElegido.Paralelo is null)
            return Response<ReMatricularResultDTO>.Failure(
                $"El paralelo ID {request.IdMallaParalelo} no está activo o no pertenece a la malla destino.");

        if (mallaParaleloDestino.CupoMaximo.HasValue &&
            paraleloElegido.Matriculados >= mallaParaleloDestino.CupoMaximo.Value)
            return Response<ReMatricularResultDTO>.Failure(
                "El paralelo seleccionado no tiene cupo disponible.");

        // 6. Cerrar matrícula anterior si se solicitó
        bool matriculaAnteriorCerrada = false;
        if (request.CerrarMatriculaAnterior &&
            matriculaAnterior.IdEstadoMatriculaNavigation?.Completado == false)
        {
            if (request.IdEstadoMatriculaCompletado is null)
                return Response<ReMatricularResultDTO>.Failure(
                    "Se requiere IdEstadoMatriculaCompletado para cerrar la matrícula anterior automáticamente.");

            var estadoCierre = await _estadoRepo.GetByIdAsync(request.IdEstadoMatriculaCompletado.Value, ct);
            if (estadoCierre is null)
                return Response<ReMatricularResultDTO>.Failure(
                    $"El estado de matrícula ID {request.IdEstadoMatriculaCompletado} no existe.");

            if (!estadoCierre.Completado)
                return Response<ReMatricularResultDTO>.Failure(
                    "El IdEstadoMatriculaCompletado indicado no tiene Completado = true.");

            await _matriculaRepo.ActualizarEstadoMatriculaAsync(
                matriculaAnterior.IdMatricula, request.IdEstadoMatriculaCompletado.Value, ct);
            matriculaAnteriorCerrada = true;
        }

        // 7. Generar la nueva matrícula (alumno ya existe, no se crea usuario nuevo)
        var resultado = await _generarMatricula.GenerarMatriculaCompletaAsync(
            idPersona: request.IdPersona,
            idMalla: mallaParaleloDestino.IdMalla,
            idMallaParalelo: request.IdMallaParalelo,
            nuevoUsuario: null,
            rolUsuario: null,
            cancellationToken: ct);

        if (!resultado.MatriculaCreada || resultado.IdMatricula is null)
            return Response<ReMatricularResultDTO>.Failure(
                "No se pudo crear la nueva matrícula. Verifique que el alumno no esté ya matriculado.");

        var resumen = new System.Text.StringBuilder();
        resumen.AppendLine($"Re-matriculación exitosa para Persona ID {request.IdPersona}.");
        resumen.AppendLine($"Nueva Matrícula ID: {resultado.IdMatricula}.");
        resumen.AppendLine($"MallaParalelo ID: {request.IdMallaParalelo}.");
        resumen.AppendLine($"{resultado.DetallesMatriculaGenerados} DetalleMatricula generados.");
        resumen.AppendLine($"{resultado.CreditosGenerados} crédito(s) financiero(s) generados.");
        if (matriculaAnteriorCerrada)
            resumen.AppendLine($"Matrícula anterior ID {matriculaAnterior.IdMatricula} cerrada automáticamente.");

        return Response<ReMatricularResultDTO>.Success(new ReMatricularResultDTO
        {
            IdPersona = request.IdPersona,
            IdMatriculaNueva = resultado.IdMatricula.Value,
            IdMallaParalelo = request.IdMallaParalelo,
            MatriculaAnteriorCerrada = matriculaAnteriorCerrada,
            Resumen = resumen.ToString().Trim()
        }, "Re-matriculación completada exitosamente.");
    }
}
