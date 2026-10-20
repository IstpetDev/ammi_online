using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Domain.Interfaces.Payments;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public class GetHistorialPagosHandler : IRequestHandler<GetHistorialPagosQuery, Response<IEnumerable<PagoHistorialDTO>>>
{
    private readonly IHistorialPagoRepository _historialPagoRepository;

    public GetHistorialPagosHandler(IHistorialPagoRepository historialPagoRepository)
    {
        _historialPagoRepository = historialPagoRepository;
    }

    public async Task<Response<IEnumerable<PagoHistorialDTO>>> Handle(GetHistorialPagosQuery request, CancellationToken cancellationToken)
    {

        var pagos = await _historialPagoRepository.GetHistorialPagosAsync(
            request.Documento,
            request.IdMatricula,
            request.FechaDesde,
            request.FechaHasta,
            request.EsValidado,
            cancellationToken);

        var resultado = pagos.Select(p => new PagoHistorialDTO
        {
            IdPago = p.IdPago,
            FechaPago = p.FechaPago,
            ValorPago = p.ValorPago,
            TipoPago = p.IdTipoPagoNavigation?.Detalle ?? string.Empty,
            EsValidado = p.EsValidado,
            // Datos del alumno desde la primera cuota
            Documento = p.PagoCuota.FirstOrDefault()?.IdDetalleCreditoNavigation?.IdCreditoNavigation?
                                  .IdMatriculaNavigation?.IdUsuarioAlumnoNavigation?.IdPersonaNavigation?.Documento ?? string.Empty,
            NumeroDeposito = p.NumeroDeposito,
            BancoDeposito = p.IdCuentaBancariaNavigation.Banco,
            AlumnoNombre = ConstruirNombreCompleto(
                       p.PagoCuota.FirstOrDefault()?.IdDetalleCreditoNavigation?.IdCreditoNavigation?
                           .IdMatriculaNavigation?.IdUsuarioAlumnoNavigation?.IdPersonaNavigation),
            IdMatricula = p.PagoCuota.FirstOrDefault()?.IdDetalleCreditoNavigation?
                                     .IdCreditoNavigation?.IdMatricula ?? 0,
            // Campos de resumen del crédito
            EstadoCredito = p.PagoCuota.FirstOrDefault()?.IdDetalleCreditoNavigation?
                              .IdCreditoNavigation?.Estado,
            TotalPagadoCredito = p.PagoCuota.Sum(pc => pc.ValorAplicado),
            NumeroCuotasPagadas = p.PagoCuota.Count(pc => pc.IdDetalleCreditoNavigation != null && pc.IdDetalleCreditoNavigation.Pagado),
            CuotasPagadas = p.PagoCuota.Select(pc => new PagoCuotaHistorialDTO
            {
                IdPagoCuota = pc.IdPagoCuota,
                IdDetalleCredito = pc.IdDetalleCredito,
                NumeroCuota = pc.IdDetalleCreditoNavigation?.NumeroCuota ?? 0,
                ValorAplicado = pc.ValorAplicado,
                ValorOriginalCuota = pc.IdDetalleCreditoNavigation?.ValorOriginal ?? 0,
                SaldoCuota = pc.IdDetalleCreditoNavigation?.SaldoCuota ?? 0,
                EstadoCuota = pc.IdDetalleCreditoNavigation?.Estado ?? string.Empty,
                IdCredito = pc.IdDetalleCreditoNavigation?.IdCredito ?? 0,
                DetalleEspecie = pc.IdDetalleCreditoNavigation?.IdCreditoNavigation?
                                     .IdEspecieCicloNavigation?.IdEspecieNavigation?.Detalle ?? string.Empty,
                EsDiferible = pc.IdDetalleCreditoNavigation?.IdCreditoNavigation?
                                  .IdEspecieCicloNavigation?.IdEspecieNavigation?.EsDiferible ?? false
            }).ToList()
        }).ToList();

        return new Response<IEnumerable<PagoHistorialDTO>>(resultado);
    }

    private string ConstruirNombreCompleto(Domain.Entities.Persona? persona)
    {
        if (persona == null) return string.Empty;
        return $"{persona.PrimerNombre ?? ""} {persona.SegundoNombre ?? ""} {persona.PrimerApellido ?? ""} {persona.SegundoApellido ?? ""}".Trim();
    }
}
