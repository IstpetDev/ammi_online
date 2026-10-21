using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Handlers;

public class DuplicarMallaHandler : IRequestHandler<DuplicarMallaCommand, DuplicarMallaResultDTO>
{
    private readonly IUnitOfWork _uow;
    private readonly ICiclo _cicloRepo;
    private readonly IMallaRepository _mallaRepo;
    private readonly IDetalleMallaRepository _detalleMallaRepo;
    private readonly IMallaRequisitosRepository _mallaRequisitosRepo;
    private readonly IEspecieCicloRepository _especieCicloRepo;

    public DuplicarMallaHandler(
        IUnitOfWork uow,
        ICiclo cicloRepo,
        IMallaRepository mallaRepo,
        IDetalleMallaRepository detalleMallaRepo,
        IMallaRequisitosRepository mallaRequisitosRepo,
        IEspecieCicloRepository especieCicloRepo)
    {
        _uow = uow;
        _cicloRepo = cicloRepo;
        _mallaRepo = mallaRepo;
        _detalleMallaRepo = detalleMallaRepo;
        _mallaRequisitosRepo = mallaRequisitosRepo;
        _especieCicloRepo = especieCicloRepo;
    }

    public async Task<DuplicarMallaResultDTO> Handle(
        DuplicarMallaCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        // ── Validaciones previas (sin transacción aún) ───────────────────────

        // 1. Malla origen debe existir
        var mallaOrigen = await _mallaRepo.GetByIdAsync(req.IdMallaOrigen, cancellationToken)
            ?? throw new InvalidOperationException($"No existe la malla con ID {req.IdMallaOrigen}.");

        // 2. Ciclo destino debe existir y estar activo
        var cicloDestino = await _cicloRepo.GetByIdAsync(req.IdCicloDestino, cancellationToken)
            ?? throw new InvalidOperationException($"No existe el ciclo con ID {req.IdCicloDestino}.");

        if (!cicloDestino.EsActivo)
            throw new InvalidOperationException(
                $"El ciclo '{cicloDestino.Detalle}' (ID {req.IdCicloDestino}) no está activo. " +
                "Solo se puede duplicar una malla en un ciclo activo.");

        // 3. No debe existir ya una malla con el mismo IdCursos en el ciclo destino
        var mallasEnCicloDestino = await _mallaRepo.GetByCicloIdAsync(req.IdCicloDestino, cancellationToken);
        if (mallasEnCicloDestino.Any(m => m.IdCursos == mallaOrigen.IdCursos))
            throw new InvalidOperationException(
                $"Ya existe una malla con el mismo curso (ID {mallaOrigen.IdCursos}) en el ciclo destino (ID {req.IdCicloDestino}).");

        // 4. Cargar EspecieCiclo de la malla origen para copiarlas si el request no provee las suyas
        var especiesOrigen = (await _especieCicloRepo.GetByMallaAsync(req.IdMallaOrigen, cancellationToken)).ToList();

        // Determinar qué especies usar: las del request (si las hay) o las de la malla origen
        var especiesInput = (req.Especies != null && req.Especies.Count > 0)
            ? req.Especies
            : especiesOrigen.Select(e => new EspecieCicloInputDTO
            {
                IdEspecie = e.IdEspecie,
                ValorEspecie = e.ValorEspecie
            }).ToList();

        if (especiesInput.Count == 0)
            throw new InvalidOperationException(
                "La malla origen no tiene especies registradas y no se proporcionaron especies en la solicitud.");

        // ── Cargar datos origen ───────────────────────────────────────────────

        var detalleMallaOrigen = (await _detalleMallaRepo.GetByMallaIdAsync(req.IdMallaOrigen, cancellationToken)).ToList();
        var requisitosOrigen = (await _mallaRequisitosRepo.GetByMallaIdAsync(req.IdMallaOrigen, cancellationToken)).ToList();

        // ── Creación atómica con transacción ──────────────────────────────────

        await _uow.BeginTransactionAsync(cancellationToken);
        try
        {
            // 5. Crear nueva Malla en el ciclo destino
            var mallaNueva = await _mallaRepo.AddAsync(new Malla
            {
                Detalle = mallaOrigen.Detalle,
                IdCursos = mallaOrigen.IdCursos,
                IdCiclo = req.IdCicloDestino
            }, cancellationToken);

            // 6. Duplicar DetalleMalla (sin copiar fechas — pueden cambiar por ciclo)
            var nuevosDetalles = detalleMallaOrigen.Select(dm => new DetalleMalla
            {
                IdMalla = mallaNueva.IdMalla,
                IdMateria = dm.IdMateria,
                IdPlantillaEvaluacion = dm.IdPlantillaEvaluacion,
                IdAreaCompetencia = dm.IdAreaCompetencia,
                Modulo = dm.Modulo,
                DuracionHoras = dm.DuracionHoras,
                FechaInicio = null,
                FechaFin = null
            });
            var detalleMallaCreados = (await _detalleMallaRepo.AddRangeAsync(nuevosDetalles, cancellationToken)).ToList();

            // 7. Duplicar MallaRequisitos
            var nuevosRequisitos = requisitosOrigen.Select(r => new MallaRequisitos
            {
                IdMalla = mallaNueva.IdMalla,
                IdRequisitos = r.IdRequisitos
            });
            var requisitosCreados = (await _mallaRequisitosRepo.AddRangeAsync(nuevosRequisitos, cancellationToken)).ToList();

            // 8. Crear EspecieCiclo para la nueva malla
            var idsEspecie = new List<int>();
            foreach (var especie in especiesInput)
            {
                var ec = await _especieCicloRepo.CreateAsync(new EspecieCiclo
                {
                    IdMalla = mallaNueva.IdMalla,
                    IdEspecie = especie.IdEspecie,
                    ValorEspecie = especie.ValorEspecie
                }, cancellationToken);
                idsEspecie.Add(ec.IdEspecieCiclo);
            }

            await _uow.CommitAsync(cancellationToken);

            var resumen = $"Malla origen ID {req.IdMallaOrigen} duplicada como Malla ID {mallaNueva.IdMalla} " +
                          $"en ciclo '{cicloDestino.Detalle}' (ID {req.IdCicloDestino}). " +
                          $"{detalleMallaCreados.Count} DetalleMalla, {requisitosCreados.Count} MallaRequisitos, " +
                          $"{idsEspecie.Count} EspecieCiclo creadas.";

            return new DuplicarMallaResultDTO
            {
                IdMallaOrigen = req.IdMallaOrigen,
                IdMallaDestino = mallaNueva.IdMalla,
                IdCicloDestino = req.IdCicloDestino,
                TotalDetalleMalla = detalleMallaCreados.Count,
                TotalRequisitos = requisitosCreados.Count,
                IdsEspecieCiclo = idsEspecie,
                Resumen = resumen
            };
        }
        catch
        {
            await _uow.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
