using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Domain.Interfaces.Distributive;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Application.Features.Infrastructure.Handlers;

public class MallaParaleloHandler :
    IRequestHandler<ActivarMallaParaleloCommand, Response<bool>>,
    IRequestHandler<DesactivarMallaParaleloCommand, Response<bool>>,
    IRequestHandler<CrearMallaParaleloCommand, Response<int>>,
    IRequestHandler<GetMallaParaleloByMallaQuery, Response<IEnumerable<MallaParaleloDTO>>>
{
    private readonly IMallaParaleloRepository _mallaParaleloRepo;
    private readonly IDistributivoRepository _distributivoRepo;
    private readonly IDetalleMallaRepository _detalleMallaRepo;

    public MallaParaleloHandler(
        IMallaParaleloRepository mallaParaleloRepo,
        IDistributivoRepository distributivoRepo,
        IDetalleMallaRepository detalleMallaRepo)
    {
        _mallaParaleloRepo = mallaParaleloRepo;
        _distributivoRepo = distributivoRepo;
        _detalleMallaRepo = detalleMallaRepo;
    }

    public async Task<Response<int>> Handle(CrearMallaParaleloCommand request, CancellationToken ct)
    {
        var data = request.Data;

        // Validar que no exista ya ese paralelo en la malla
        var existentes = await _mallaParaleloRepo.GetByMallaAsync(data.IdMalla, ct);
        var existente = existentes.FirstOrDefault(mp => mp.IdParalelo == data.IdParalelo);
        if (existente != null)
        {
            existente.CupoMaximo = data.CupoMaximo;
            existente.EsActivo = true;
            await _mallaParaleloRepo.UpdateAsync(existente, ct);
            return Response<int>.Success(existente.IdMallaParalelo, "Paralelo actualizado en la malla.");
        }

        // Crear el MallaParalelo
        var nuevoMp = new MallaParalelo
        {
            IdMalla = data.IdMalla,
            IdParalelo = data.IdParalelo,
            CupoMaximo = data.CupoMaximo,
            EsActivo = true
        };

        await _mallaParaleloRepo.AddAsync(nuevoMp, ct);

        // Auto-generar Distributivos: uno por cada DetalleMalla de la Malla, sin docente
        var detallesMalla = await _detalleMallaRepo.GetByMallaIdAsync(data.IdMalla, ct);

        var distributivos = detallesMalla.Select(dm => new AMMI_Online_API.Domain.Entities.Distributivo
        {
            IdDetalleMalla = dm.IdDetalleMalla,
            IdMallaParalelo = nuevoMp.IdMallaParalelo,
            IdPersona = null,
            Activo = true
        }).ToList();

        if (distributivos.Any())
            await _distributivoRepo.AddRangeAsync(distributivos, ct);

        return Response<int>.Success(nuevoMp.IdMallaParalelo,
            $"MallaParalelo creado con {distributivos.Count} distributivo(s) generado(s).");
    }

    public async Task<Response<bool>> Handle(ActivarMallaParaleloCommand request, CancellationToken ct)
    {
        var mp = await _mallaParaleloRepo.GetByIdAsync(request.Data.IdMallaParalelo, ct);
        if (mp == null) return Response<bool>.Failure("MallaParalelo no encontrado");

        mp.EsActivo = true;
        await _mallaParaleloRepo.UpdateAsync(mp, ct);

        if (request.Data.ClonarDistributivos && request.Data.IdMallaParaleloOrigen.HasValue)
        {
            await _distributivoRepo.ClonarDistributivosAsync(
                request.Data.IdMallaParaleloOrigen.Value,
                request.Data.IdMallaParalelo,
                ct);
        }

        return Response<bool>.Success(true, "MallaParalelo activado" + (request.Data.ClonarDistributivos ? " y distributivos clonados" : ""));
    }

    public async Task<Response<bool>> Handle(DesactivarMallaParaleloCommand request, CancellationToken ct)
    {
        var mp = await _mallaParaleloRepo.GetByIdAsync(request.IdMallaParalelo, ct);
        if (mp == null) return Response<bool>.Failure("MallaParalelo no encontrado");

        if (await _mallaParaleloRepo.TieneAlumnosActivosAsync(request.IdMallaParalelo, ct))
            return Response<bool>.Failure("No se puede desactivar un paralelo con alumnos activos (matrículas no finalizadas).");

        var activos = await _mallaParaleloRepo.CountActivosByMallaAsync(mp.IdMalla, ct);
        if (mp.EsActivo && activos <= 1)
            return Response<bool>.Failure("No se puede desactivar el último paralelo activo de esta malla.");

        mp.EsActivo = false;
        await _mallaParaleloRepo.UpdateAsync(mp, ct);

        return Response<bool>.Success(true, "MallaParalelo desactivado");
    }

    public async Task<Response<IEnumerable<MallaParaleloDTO>>> Handle(GetMallaParaleloByMallaQuery request, CancellationToken ct)
    {
        var entities = await _mallaParaleloRepo.GetByMallaAsync(request.IdMalla, ct);
        var dtos = entities.Select(e => new MallaParaleloDTO
        {
            IdMallaParalelo = e.IdMallaParalelo,
            IdMalla = e.IdMalla,
            IdParalelo = e.IdParalelo,
            NombreParalelo = e.IdParaleloNavigation?.Detalle ?? string.Empty,
            CupoMaximo = e.CupoMaximo ?? 0,
            EsActivo = e.EsActivo,
            AlumnosMatriculados = e.Matricula.Count
        });

        return Response<IEnumerable<MallaParaleloDTO>>.Success(dtos, "Paralelos encontrados");
    }
}
