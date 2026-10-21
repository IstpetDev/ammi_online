using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces;
using DistributivoEntity = AMMI_Online_API.Domain.Entities.Distributivo;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Domain.Interfaces.Distributive;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Handlers;

public class CrearMallaCompletaHandler : IRequestHandler<CrearMallaCompletaCommand, CrearMallaCompletaResultDTO>
{
    private readonly IUnitOfWork _uow;
    private readonly ICiclo _cicloRepo;
    private readonly IMallaRepository _mallaRepo;
    private readonly IMallaRequisitosRepository _mallaRequisitosRepo;
    private readonly IDetalleMallaRepository _detalleMallaRepo;
    private readonly IEspecieCicloRepository _especieCicloRepo;
    private readonly IMallaParaleloRepository _mallaParaleloRepo;
    private readonly IDistributivoRepository _distributivoRepo;

    public CrearMallaCompletaHandler(
        IUnitOfWork uow,
        ICiclo cicloRepo,
        IMallaRepository mallaRepo,
        IMallaRequisitosRepository mallaRequisitosRepo,
        IDetalleMallaRepository detalleMallaRepo,
        IEspecieCicloRepository especieCicloRepo,
        IMallaParaleloRepository mallaParaleloRepo,
        IDistributivoRepository distributivoRepo)
    {
        _uow = uow;
        _cicloRepo = cicloRepo;
        _mallaRepo = mallaRepo;
        _mallaRequisitosRepo = mallaRequisitosRepo;
        _detalleMallaRepo = detalleMallaRepo;
        _especieCicloRepo = especieCicloRepo;
        _mallaParaleloRepo = mallaParaleloRepo;
        _distributivoRepo = distributivoRepo;
    }

    public async Task<CrearMallaCompletaResultDTO> Handle(
        CrearMallaCompletaCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        await _uow.BeginTransactionAsync(cancellationToken);
        try
        {
            // 1. Ciclo: crear uno nuevo o usar uno existente según CrearCiclo
            Ciclo ciclo;
            bool cicloNuevo = req.CrearCiclo;

            if (cicloNuevo)
            {
                ciclo = await _cicloRepo.AddAsync(new Ciclo
                {
                    IdPadre = req.NuevoCiclo.IdPadre,
                    IdPeriodo = req.NuevoCiclo.IdPeriodo,
                    IdRegimen = req.NuevoCiclo.IdRegimen,
                    Detalle = req.NuevoCiclo.Detalle,
                    FechaInicioEstimada = req.NuevoCiclo.FechaInicioEstimada,
                    FechaFinEstimada = req.NuevoCiclo.FechaFinEstimada,
                    EsActivo = true
                }, cancellationToken);
            }
            else
            {
                ciclo = await _cicloRepo.GetByIdAsync(req.IdCiclo!.Value, cancellationToken)
                    ?? throw new KeyNotFoundException($"No se encontró el Ciclo con ID {req.IdCiclo.Value}.");
            }

            // 2. Crear Malla
            var malla = await _mallaRepo.AddAsync(new Malla
            {
                Detalle = req.Malla.Detalle,
                IdCursos = req.Malla.IdCursos,
                IdCiclo = ciclo.IdCiclo
            }, cancellationToken);

            // 3. Crear MallaRequisitos en bulk
            var idsRequisitos = new List<int>();
            if (req.IdsRequisitos.Count > 0)
            {
                var requisitos = req.IdsRequisitos.Select(idReq => new MallaRequisitos
                {
                    IdMalla = malla.IdMalla,
                    IdRequisitos = idReq
                });
                var creados = await _mallaRequisitosRepo.AddRangeAsync(requisitos, cancellationToken);
                idsRequisitos.AddRange(creados.Select(r => r.IdMallaRequisitos));
            }

            // 4. Crear DetalleMalla por cada materia en bulk
            var detalles = req.Materias.Select(m => new DetalleMalla
            {
                IdMalla = malla.IdMalla,
                IdMateria = m.IdMateria,
                IdPlantillaEvaluacion = m.IdPlantillaEvaluacion,
                IdAreaCompetencia = m.IdAreaCompetencia,
                Modulo = m.Modulo,
                FechaInicio = m.FechaInicio,
                FechaFin = m.FechaFin,
                DuracionHoras = m.DuracionHoras
            });
            var detalleMallaCreados = (await _detalleMallaRepo.AddRangeAsync(detalles, cancellationToken)).ToList();

            // 5. Crear 2 EspecieCiclo
            var idsEspecie = new List<int>();
            foreach (var especie in req.Especies)
            {
                var ec = await _especieCicloRepo.CreateAsync(new EspecieCiclo
                {
                    IdMalla = malla.IdMalla,
                    IdEspecie = especie.IdEspecie,
                    ValorEspecie = especie.ValorEspecie
                }, cancellationToken);
                idsEspecie.Add(ec.IdEspecieCiclo);
            }

            // 6. Opcional: Crear MallaParalelo + Distributivos
            int? idMallaParalelo = null;
            var idsDistributivo = new List<int>();

            if (req.Paralelo is not null)
            {
                var mallaParalelo = await _mallaParaleloRepo.AddAsync(new MallaParalelo
                {
                    IdMalla = malla.IdMalla,
                    IdParalelo = req.Paralelo.IdParalelo,
                    CupoMaximo = req.Paralelo.CupoMaximo,
                    EsActivo = true
                }, cancellationToken);

                idMallaParalelo = mallaParalelo.IdMallaParalelo;

                var distributivos = detalleMallaCreados.Select(dm => new DistributivoEntity
                {
                    IdDetalleMalla = dm.IdDetalleMalla,
                    IdMallaParalelo = mallaParalelo.IdMallaParalelo,
                    IdPersona = null,
                    Activo = true
                });
                await _distributivoRepo.AddRangeAsync(distributivos, cancellationToken);

                var distCreados = await _distributivoRepo.GetByMallaParaleloAsync(mallaParalelo.IdMallaParalelo, cancellationToken);
                idsDistributivo.AddRange(distCreados.Select(d => d.IdDistributivo));
            }

            await _uow.CommitAsync(cancellationToken);

            var resumen = BuildResumen(
                cicloNuevo, ciclo, malla,
                idsRequisitos.Count, detalleMallaCreados.Count,
                idsEspecie.Count, idMallaParalelo, idsDistributivo.Count);

            return new CrearMallaCompletaResultDTO
            {
                IdCiclo = ciclo.IdCiclo,
                IdMalla = malla.IdMalla,
                IdsMallaRequisitos = idsRequisitos,
                IdsDetalleMalla = detalleMallaCreados.Select(d => d.IdDetalleMalla).ToList(),
                IdsEspecieCiclo = idsEspecie,
                IdMallaParalelo = idMallaParalelo,
                IdsDistributivo = idsDistributivo,
                Resumen = resumen
            };
        }
        catch
        {
            await _uow.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static string BuildResumen(
        bool cicloNuevo, Ciclo ciclo, Malla malla,
        int totalRequisitos, int totalMaterias, int totalEspecies,
        int? idMallaParalelo, int totalDistributivos)
    {
        var sb = new System.Text.StringBuilder();
        if (cicloNuevo)
            sb.AppendLine($"Ciclo '{ciclo.Detalle}' (ID {ciclo.IdCiclo}) creado con Periodo ID {ciclo.IdPeriodo} y Regimen ID {ciclo.IdRegimen}.");
        else
            sb.AppendLine($"Ciclo existente '{ciclo.Detalle}' (ID {ciclo.IdCiclo}) reutilizado.");
        sb.AppendLine($"Malla '{malla.Detalle}' (ID {malla.IdMalla}) creada.");
        sb.AppendLine($"{totalRequisitos} requisito(s) asociado(s).");
        sb.AppendLine($"{totalMaterias} materia(s) en DetalleMalla creada(s).");
        sb.AppendLine($"{totalEspecies} EspecieCiclo creada(s).");
        if (idMallaParalelo.HasValue)
            sb.AppendLine($"MallaParalelo (ID {idMallaParalelo}) con {totalDistributivos} distributivo(s) creado(s).");
        else
            sb.AppendLine("Sin paralelo creado (opcional no suministrado).");
        return sb.ToString().Trim();
    }
}
