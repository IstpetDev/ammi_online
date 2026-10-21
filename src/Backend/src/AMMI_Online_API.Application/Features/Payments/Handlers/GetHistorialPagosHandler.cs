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

        var resultado = pagos.Select(p => {
            var primeraCuota = p.PagoCuota.FirstOrDefault();
            var persona = primeraCuota?.IdDetalleCreditoNavigation?.IdCreditoNavigation?
                .IdMatriculaNavigation?.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;

            var primerApellido = persona?.PrimerApellido ?? string.Empty;
            var segundoApellido = persona?.SegundoApellido ?? string.Empty;
            var primerNombre = persona?.PrimerNombre ?? string.Empty;
            var segundoNombre = persona?.SegundoNombre ?? string.Empty;

            var dto = new PagoHistorialDTO
            {
                IdPago = p.IdPago,
                FechaPago = p.FechaPago,
                ValorPago = p.ValorPago,
                TipoPago = p.IdTipoPagoNavigation?.Detalle ?? string.Empty,
                EstadoPago = p.IdEstadoPagoNavigation?.Detalle ?? string.Empty,
                EsCancelado = p.IdEstadoPagoNavigation?.EsCancelado ?? false,
                // Tomamos los datos del alumno desde la primera cuota (asumimos que todas pertenecen a la misma matrícula)
                Documento = persona?.Documento ?? string.Empty,
                NumeroDeposito = p.NumeroDeposito,
                BancoDeposito = p.IdCuentaBancariaNavigation?.Banco ?? string.Empty,
                PathComprobante = p.UrlComprobanteNavigation?.Path,
                AlumnoNombre = ConstruirNombreCompleto(persona),
                IdMatricula = primeraCuota?.IdDetalleCreditoNavigation?
                                         .IdCreditoNavigation?.IdMatricula ?? 0,
                // Campos de resumen del crédito
                EstadoCredito = primeraCuota?.IdDetalleCreditoNavigation?
                                  .IdCreditoNavigation?.Estado,
                TotalPagadoCredito = p.PagoCuota.Sum(pc => pc.ValorAplicado),
                NumeroCuotasPagadas = p.PagoCuota.Count(pc => pc.IdDetalleCreditoNavigation != null && pc.IdDetalleCreditoNavigation.Pagado),
                IdCliente = p.IdCliente ?? 0,
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
                    EsDiferible = (pc.IdDetalleCreditoNavigation?.IdCreditoNavigation?
                                      .IdEspecieCicloNavigation?.IdEspecieNavigation?.EsPension ?? false)
                                  && !(pc.IdDetalleCreditoNavigation?.IdCreditoNavigation?
                                      .IdEspecieCicloNavigation?.IdEspecieNavigation?.EsMatricula ?? false)
                }).ToList(),
                Observaciones = p.Observaciones,
                UsuarioAprueba = p.UsuarioAprueba,
                FechaAprobacion = p.FechaAprobacion,
                UsuarioApruebaNombre = p.UsuarioApruebaNavigation?.IdPersonaNavigation != null
                    ? ConstruirNombreCompleto(p.UsuarioApruebaNavigation.IdPersonaNavigation)
                    : null
            };

            return new
            {
                Dto = dto,
                PrimerApellido = primerApellido,
                SegundoApellido = segundoApellido,
                PrimerNombre = primerNombre,
                SegundoNombre = segundoNombre
            };
        })
        .OrderBy(x => x.PrimerApellido)
        .ThenBy(x => x.SegundoApellido)
        .ThenBy(x => x.PrimerNombre)
        .ThenBy(x => x.SegundoNombre)
        .ThenByDescending(x => x.Dto.FechaPago)
        .Select(x => x.Dto)
        .ToList();

        return new Response<IEnumerable<PagoHistorialDTO>>(resultado);
    }

    private string ConstruirNombreCompleto(Domain.Entities.Persona? persona)
    {
        if (persona == null) return string.Empty;
        return $"{persona.PrimerNombre ?? ""} {persona.SegundoNombre ?? ""} {persona.PrimerApellido ?? ""} {persona.SegundoApellido ?? ""}".Trim();
    }
}
