using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Handlers;

/// <summary>
/// Clona todas las mallas de un ciclo origen en un ciclo destino.
/// Por cada malla: copia DetalleMalla, MallaRequisitos y EspecieCiclo (valores del origen).
/// Opcionalmente clona también los MallaParalelo con sus cupos.
/// La operación es atómica: si algo falla, se hace rollback completo.
/// </summary>
public class ClonarMallasParaCicloHandler
    : IRequestHandler<ClonarMallasParaCicloCommand, ClonarMallasResultDTO>
{
    private readonly IUnitOfWork _uow;
    private readonly ICiclo _cicloRepo;
    private readonly IMallaRepository _mallaRepo;
    private readonly IDetalleMallaRepository _detalleMallaRepo;
    private readonly IMallaRequisitosRepository _mallaRequisitosRepo;
    private readonly IEspecieCicloRepository _especieCicloRepo;
    private readonly IMallaParaleloRepository _mallaParaleloRepo;

    public ClonarMallasParaCicloHandler(
        IUnitOfWork uow,
        ICiclo cicloRepo,
        IMallaRepository mallaRepo,
        IDetalleMallaRepository detalleMallaRepo,
        IMallaRequisitosRepository mallaRequisitosRepo,
        IEspecieCicloRepository especieCicloRepo,
        IMallaParaleloRepository mallaParaleloRepo)
    {
        _uow = uow;
        _cicloRepo = cicloRepo;
        _mallaRepo = mallaRepo;
        _detalleMallaRepo = detalleMallaRepo;
        _mallaRequisitosRepo = mallaRequisitosRepo;
        _especieCicloRepo = especieCicloRepo;
        _mallaParaleloRepo = mallaParaleloRepo;
    }

    public async Task<ClonarMallasResultDTO> Handle(
        ClonarMallasParaCicloCommand request, CancellationToken ct)
    {
        var req = request.Request;

        // ── Validaciones previas ──────────────────────────────────────────────

        var cicloOrigen = await _cicloRepo.GetByIdAsync(req.IdCicloOrigen, ct)
            ?? throw new InvalidOperationException($"No existe el ciclo origen con ID {req.IdCicloOrigen}.");

        var cicloDestino = await _cicloRepo.GetByIdAsync(req.IdCicloDestino, ct)
            ?? throw new InvalidOperationException($"No existe el ciclo destino con ID {req.IdCicloDestino}.");

        if (!cicloDestino.EsActivo)
            throw new InvalidOperationException(
                $"El ciclo destino '{cicloDestino.Detalle}' (ID {req.IdCicloDestino}) no está activo.");

        if (req.IdCicloOrigen == req.IdCicloDestino)
            throw new InvalidOperationException("El ciclo origen y el destino no pueden ser el mismo.");

        // Cargar todas las mallas del ciclo origen
        var mallasOrigen = (await _mallaRepo.GetByCicloIdAsync(req.IdCicloOrigen, ct)).ToList();
        if (mallasOrigen.Count == 0)
            throw new InvalidOperationException(
                $"El ciclo origen ID {req.IdCicloOrigen} no tiene mallas para clonar.");

        // Verificar que no existan ya mallas con los mismos cursos en el destino
        var mallasDestino = (await _mallaRepo.GetByCicloIdAsync(req.IdCicloDestino, ct)).ToList();
        var cursosEnDestino = mallasDestino.Select(m => m.IdCursos).ToHashSet();
        var conflictos = mallasOrigen.Where(m => cursosEnDestino.Contains(m.IdCursos)).ToList();
        if (conflictos.Count > 0)
        {
            var detalles = string.Join(", ", conflictos.Select(m => $"Curso ID {m.IdCursos}"));
            throw new InvalidOperationException(
                $"Ya existen mallas con los siguientes cursos en el ciclo destino: {detalles}.");
        }

        // ── Clonación atómica ─────────────────────────────────────────────────

        await _uow.BeginTransactionAsync(ct);
        try
        {
            var itemsResult = new List<ClonarMallaItemResultDTO>();

            foreach (var mallaOrigen in mallasOrigen)
            {
                // 1. Crear nueva Malla en ciclo destino
                var mallaNueva = await _mallaRepo.AddAsync(new Malla
                {
                    Detalle = mallaOrigen.Detalle,
                    IdCursos = mallaOrigen.IdCursos,
                    IdCiclo = req.IdCicloDestino
                }, ct);

                // 2. Clonar DetalleMalla (fechas se limpian; se configurarán por el admin)
                var detalleMallaOrigen = (await _detalleMallaRepo.GetByMallaIdAsync(
                    mallaOrigen.IdMalla, ct)).ToList();

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
                var detalleMallaCreados = (await _detalleMallaRepo.AddRangeAsync(nuevosDetalles, ct)).ToList();

                // 3. Clonar MallaRequisitos
                var requisitosOrigen = (await _mallaRequisitosRepo.GetByMallaIdAsync(
                    mallaOrigen.IdMalla, ct)).ToList();

                var nuevosRequisitos = requisitosOrigen.Select(r => new MallaRequisitos
                {
                    IdMalla = mallaNueva.IdMalla,
                    IdRequisitos = r.IdRequisitos
                });
                var requisitosCreados = (await _mallaRequisitosRepo.AddRangeAsync(nuevosRequisitos, ct)).ToList();

                // 4. Clonar EspecieCiclo (copiar valores del origen)
                var especiesOrigen = (await _especieCicloRepo.GetByMallaAsync(mallaOrigen.IdMalla, ct)).ToList();
                var idsEspecie = new List<int>();
                foreach (var especie in especiesOrigen)
                {
                    var ec = await _especieCicloRepo.CreateAsync(new EspecieCiclo
                    {
                        IdMalla = mallaNueva.IdMalla,
                        IdEspecie = especie.IdEspecie,
                        ValorEspecie = especie.ValorEspecie
                    }, ct);
                    idsEspecie.Add(ec.IdEspecieCiclo);
                }

                // 5. Clonar MallaParalelo si se solicitó
                int totalParalelos = 0;
                if (req.ClonarParalelos)
                {
                    var paralelosOrigen = (await _mallaParaleloRepo.GetByMallaAsync(
                        mallaOrigen.IdMalla, ct)).ToList();

                    foreach (var paralelo in paralelosOrigen)
                    {
                        await _mallaParaleloRepo.AddAsync(new MallaParalelo
                        {
                            IdMalla = mallaNueva.IdMalla,
                            IdParalelo = paralelo.IdParalelo,
                            CupoMaximo = paralelo.CupoMaximo,
                            EsActivo = true
                        }, ct);
                        totalParalelos++;
                    }
                }

                itemsResult.Add(new ClonarMallaItemResultDTO
                {
                    IdMallaOrigen = mallaOrigen.IdMalla,
                    IdMallaDestino = mallaNueva.IdMalla,
                    Detalle = mallaNueva.Detalle,
                    TotalDetalles = detalleMallaCreados.Count,
                    TotalRequisitos = requisitosCreados.Count,
                    TotalEspecies = idsEspecie.Count,
                    TotalParalelos = totalParalelos
                });
            }

            await _uow.CommitAsync(ct);

            var resumen = $"Ciclo '{cicloOrigen.Detalle}' → '{cicloDestino.Detalle}': " +
                          $"{itemsResult.Count} malla(s) clonada(s). " +
                          $"Detalles: {itemsResult.Sum(i => i.TotalDetalles)} DetalleMalla, " +
                          $"{itemsResult.Sum(i => i.TotalRequisitos)} MallaRequisitos, " +
                          $"{itemsResult.Sum(i => i.TotalEspecies)} EspecieCiclo, " +
                          $"{itemsResult.Sum(i => i.TotalParalelos)} MallaParalelo.";

            return new ClonarMallasResultDTO
            {
                IdCicloOrigen = req.IdCicloOrigen,
                IdCicloDestino = req.IdCicloDestino,
                TotalMallasClonadas = itemsResult.Count,
                Mallas = itemsResult,
                Resumen = resumen
            };
        }
        catch
        {
            await _uow.RollbackAsync(ct);
            throw;
        }
    }
}
