using System.Net;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class AsignarCreditoExtraHandler : IRequestHandler<AsignarCreditoExtraCommand, Response<CreditoExtraItemDTO>>
{
    private readonly ICreditoRepository _creditoRepository;

    public AsignarCreditoExtraHandler(ICreditoRepository creditoRepository)
    {
        _creditoRepository = creditoRepository;
    }

    public async Task<Response<CreditoExtraItemDTO>> Handle(AsignarCreditoExtraCommand request, CancellationToken cancellationToken)
    {
        var dto = request.DTO;
        if (dto.IdMatricula <= 0)
            return Response<CreditoExtraItemDTO>.Failure("La matrícula es requerida.");

        if (dto.IdEspecie <= 0)
            return Response<CreditoExtraItemDTO>.Failure("El rubro/arancel es requerido.");

        if (dto.Monto <= 0)
            return Response<CreditoExtraItemDTO>.Failure("El monto debe ser mayor a 0.");

        var credito = await _creditoRepository.AsignarCreditoExtraAsync(
            dto.IdMatricula,
            dto.IdEspecie,
            dto.Monto,
            dto.FechaLimite,
            dto.Observaciones,
            cancellationToken);

        var list = await _creditoRepository.GetCreditosExtrasAsync(dto.IdMatricula, cancellationToken);
        var created = list.FirstOrDefault(c => c.IdCredito == credito.IdCredito);

        var detalle = created?.DetalleCredito.FirstOrDefault();
        var persona = created?.IdMatriculaNavigation?.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;
        var mp = created?.IdMatriculaNavigation?.IdMallaParaleloNavigation;
        var malla = created?.IdEspecieCicloNavigation?.IdMallaNavigation;

        var valorOriginal = detalle?.ValorOriginal ?? credito.MontoOriginal;
        var saldoCuota = detalle?.SaldoCuota ?? credito.SaldoPendiente;
        var valorCancelado = Math.Max(0, valorOriginal - saldoCuota);

        var result = new CreditoExtraItemDTO
        {
            IdCredito = credito.IdCredito,
            IdMatricula = credito.IdMatricula,
            IdDetalleCredito = detalle?.IdDetalleCredito ?? 0,
            AlumnoNombre = persona != null ? $"{persona.PrimerApellido} {persona.SegundoApellido} {persona.PrimerNombre} {persona.SegundoNombre}".Trim() : string.Empty,
            Documento = persona?.Documento ?? string.Empty,
            Curso = malla?.IdCicloNavigation?.Detalle ?? string.Empty,
            Paralelo = mp?.IdParaleloNavigation?.Detalle ?? string.Empty,
            Ciclo = malla?.IdCicloNavigation?.Detalle ?? string.Empty,
            IdEspecie = dto.IdEspecie,
            EspecieDetalle = created?.IdEspecieCicloNavigation?.IdEspecieNavigation?.Detalle ?? string.Empty,
            MontoOriginal = credito.MontoOriginal,
            SaldoPendiente = credito.SaldoPendiente,
            ValorCancelado = valorCancelado,
            Estado = detalle?.Estado ?? "PENDIENTE",
            FechaGeneracion = credito.FechaGeneracion,
            FechaLimite = detalle?.FechaLimite,
            Pagado = detalle?.Pagado ?? false,
            TienePagos = false
        };

        return new Response<CreditoExtraItemDTO>(result, "Costo extra asignado correctamente al estudiante.");
    }
}

public class AsignarCreditoExtraMasivoHandler : IRequestHandler<AsignarCreditoExtraMasivoCommand, Response<AsignarCreditoExtraMasivoResultDTO>>
{
    private readonly ICreditoRepository _creditoRepository;

    public AsignarCreditoExtraMasivoHandler(ICreditoRepository creditoRepository)
    {
        _creditoRepository = creditoRepository;
    }

    public async Task<Response<AsignarCreditoExtraMasivoResultDTO>> Handle(AsignarCreditoExtraMasivoCommand request, CancellationToken cancellationToken)
    {
        var dto = request.DTO;
        if (dto.IdsMallas == null || !dto.IdsMallas.Any())
            return Response<AsignarCreditoExtraMasivoResultDTO>.Failure("Debe seleccionar al menos un curso.");

        if (dto.IdEspecie <= 0)
            return Response<AsignarCreditoExtraMasivoResultDTO>.Failure("El rubro/arancel es requerido.");

        if (dto.Monto <= 0)
            return Response<AsignarCreditoExtraMasivoResultDTO>.Failure("El monto debe ser mayor a 0.");

        try
        {
            var (totalEvaluadas, totalAsignados, totalOmitidos) = await _creditoRepository.AsignarCreditoExtraMasivoAsync(
                dto.IdsMallas,
                dto.IdEspecie,
                dto.Monto,
                dto.FechaLimite,
                dto.Observaciones,
                cancellationToken);

            var resultado = new AsignarCreditoExtraMasivoResultDTO
            {
                TotalMatriculasEvaluadas = totalEvaluadas,
                TotalAsignados = totalAsignados,
                TotalOmitidosDuplicados = totalOmitidos,
                Mensaje = $"Proceso completado. Asignados: {totalAsignados}. Omitidos por registro previo: {totalOmitidos}."
            };

            return new Response<AsignarCreditoExtraMasivoResultDTO>(resultado, resultado.Mensaje);
        }
        catch (Exception ex)
        {
            return Response<AsignarCreditoExtraMasivoResultDTO>.Failure($"Error al procesar asignación masiva: {ex.Message}");
        }
    }
}

public class AnularCreditoExtraHandler : IRequestHandler<AnularCreditoExtraCommand, Response<bool>>
{
    private readonly ICreditoRepository _creditoRepository;

    public AnularCreditoExtraHandler(ICreditoRepository creditoRepository)
    {
        _creditoRepository = creditoRepository;
    }

    public async Task<Response<bool>> Handle(AnularCreditoExtraCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var res = await _creditoRepository.AnularCreditoExtraAsync(request.IdCredito, cancellationToken);
            return new Response<bool>(res, "Costo extra anulado exitosamente.");
        }
        catch (Exception ex)
        {
            return Response<bool>.Failure(ex.Message);
        }
    }
}

public class GetCreditosExtrasHandler : IRequestHandler<GetCreditosExtrasQuery, Response<IEnumerable<CreditoExtraItemDTO>>>
{
    private readonly ICreditoRepository _creditoRepository;

    public GetCreditosExtrasHandler(ICreditoRepository creditoRepository)
    {
        _creditoRepository = creditoRepository;
    }

    public async Task<Response<IEnumerable<CreditoExtraItemDTO>>> Handle(GetCreditosExtrasQuery request, CancellationToken cancellationToken)
    {
        var creditos = await _creditoRepository.GetCreditosExtrasAsync(request.IdMatricula, cancellationToken);

        var result = creditos.Select(c =>
        {
            var detalle = c.DetalleCredito.FirstOrDefault();
            var persona = c.IdMatriculaNavigation?.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;
            var mp = c.IdMatriculaNavigation?.IdMallaParaleloNavigation;
            var malla = c.IdEspecieCicloNavigation?.IdMallaNavigation;

            var valorOriginal = detalle?.ValorOriginal ?? c.MontoOriginal;
            var saldoCuota = detalle?.SaldoCuota ?? c.SaldoPendiente;
            var valorCancelado = Math.Max(0, valorOriginal - saldoCuota);

            var tienePagos = detalle != null && (
                valorCancelado > 0 || 
                detalle.PagoCuota.Any(pc => pc.IdPagoNavigation != null && pc.IdPagoNavigation.FechaEliminacion == null && pc.IdPagoNavigation.IdEstadoPago != 3 && pc.IdPagoNavigation.IdEstadoPago != 4)
            );

            return new CreditoExtraItemDTO
            {
                IdCredito = c.IdCredito,
                IdMatricula = c.IdMatricula,
                IdDetalleCredito = detalle?.IdDetalleCredito ?? 0,
                AlumnoNombre = persona != null ? $"{persona.PrimerApellido} {persona.SegundoApellido} {persona.PrimerNombre} {persona.SegundoNombre}".Trim() : string.Empty,
                Documento = persona?.Documento ?? string.Empty,
                Curso = malla?.IdCicloNavigation?.Detalle ?? string.Empty,
                Paralelo = mp?.IdParaleloNavigation?.Detalle ?? string.Empty,
                Ciclo = malla?.IdCicloNavigation?.Detalle ?? string.Empty,
                IdEspecie = c.IdEspecieCicloNavigation?.IdEspecie ?? 0,
                EspecieDetalle = c.IdEspecieCicloNavigation?.IdEspecieNavigation?.Detalle ?? string.Empty,
                MontoOriginal = c.MontoOriginal,
                SaldoPendiente = c.SaldoPendiente,
                ValorCancelado = valorCancelado,
                Estado = detalle?.Estado ?? "PENDIENTE",
                FechaGeneracion = c.FechaGeneracion,
                FechaLimite = detalle?.FechaLimite,
                Pagado = detalle?.Pagado ?? false,
                TienePagos = tienePagos
            };
        });

        return new Response<IEnumerable<CreditoExtraItemDTO>>(result);
    }
}
