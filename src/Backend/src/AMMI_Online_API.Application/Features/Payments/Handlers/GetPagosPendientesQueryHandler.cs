using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;
public class GetPagosPendientesQueryHandler : IRequestHandler<GetPagosPendientesQuery, Response<IEnumerable<PagoDTO>>>
{
    private readonly IPagoRepository _pagoRepository;

    public GetPagosPendientesQueryHandler(IPagoRepository pagoRepository)
    {
        _pagoRepository = pagoRepository;
    }

    public async Task<Response<IEnumerable<PagoDTO>>> Handle(GetPagosPendientesQuery request, CancellationToken cancellationToken)
    {
        var pagos = await _pagoRepository.GetPagosNoCanceladosAsync(
              request.IdMatricula,
              request.DocumentoCliente,
              request.DocumentoAlumno,
              cancellationToken);

        var pagosDto = pagos.Select(p => {
            var primeraCuota = p.PagoCuota.FirstOrDefault();
            var persona = primeraCuota?.IdDetalleCreditoNavigation?.IdCreditoNavigation?
                .IdMatriculaNavigation?.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;

            var apellido = !string.IsNullOrWhiteSpace(persona?.PrimerApellido)
                ? persona.PrimerApellido
                : (p.IdClienteNavigation?.Apellidos ?? string.Empty);

            var segundoApellido = !string.IsNullOrWhiteSpace(persona?.SegundoApellido)
                ? persona.SegundoApellido
                : string.Empty;

            var nombre = !string.IsNullOrWhiteSpace(persona?.PrimerNombre)
                ? persona.PrimerNombre
                : (p.IdClienteNavigation?.Nombres ?? string.Empty);

            var segundoNombre = !string.IsNullOrWhiteSpace(persona?.SegundoNombre)
                ? persona.SegundoNombre
                : string.Empty;

            var dto = new PagoDTO
            {
                IdPago = p.IdPago,
                IdTipoPago = p.IdTipoPago,
                TipoPagoDetalle = p.IdTipoPagoNavigation?.Detalle ?? string.Empty,
                IdCliente = p.IdCliente,
                ClienteDocumento = p.IdClienteNavigation?.Documento ?? string.Empty,
                ClienteNombre = $"{p.IdClienteNavigation?.Nombres} {p.IdClienteNavigation?.Apellidos}".Trim(),
                IdEstadoPago = p.IdEstadoPago,
                EstadoPagoDetalle = p.IdEstadoPagoNavigation?.Detalle ?? string.Empty,
                EsCancelado = p.IdEstadoPagoNavigation?.EsCancelado ?? false,
                FechaPago = p.FechaPago,
                ValorPago = p.ValorPago,
                FechaDeposito = p.FechaDeposito,
                IdCuentaBancaria = p.IdCuentaBancaria,
                NumeroDeposito = p.NumeroDeposito ?? string.Empty,
                FechaRegistro = p.FechaRegistro,
                UrlComprobante = p.UrlComprobante,
                FechaEliminacion = p.FechaEliminacion,
                Observaciones = p.Observaciones ?? string.Empty,
                UsuarioRegistro = p.UsuarioRegistro,
                UsuarioElimino = p.UsuarioElimino,
                IdMatricula = primeraCuota?.IdDetalleCreditoNavigation?.IdCreditoNavigation?.IdMatricula ?? 0,
                CuotasAplicadas = p.PagoCuota.Select(pc => new PagoCuotaInfoDTO
                {
                    IdPagoCuota = pc.IdPagoCuota,
                    IdDetalleCredito = pc.IdDetalleCredito,
                    NumeroCuota = pc.IdDetalleCreditoNavigation?.NumeroCuota ?? 0,
                    ValorAplicado = pc.ValorAplicado,
                    SaldoCuota = pc.IdDetalleCreditoNavigation?.SaldoCuota ?? 0,
                    EstadoCuota = pc.IdDetalleCreditoNavigation?.Estado ?? string.Empty,
                    IdCredito = pc.IdDetalleCreditoNavigation?.IdCredito ?? 0,
                    DetalleEspecie = pc.IdDetalleCreditoNavigation?.IdCreditoNavigation?.IdEspecieCicloNavigation?.IdEspecieNavigation?.Detalle ?? string.Empty
                }).ToList()
            };

            return new
            {
                Dto = dto,
                Apellido = apellido,
                SegundoApellido = segundoApellido,
                Nombre = nombre,
                SegundoNombre = segundoNombre
            };
        })
        .OrderBy(x => x.Apellido)
        .ThenBy(x => x.SegundoApellido)
        .ThenBy(x => x.Nombre)
        .ThenBy(x => x.SegundoNombre)
        .ThenByDescending(x => x.Dto.FechaPago)
        .Select(x => x.Dto)
        .ToList();

        return Response<IEnumerable<PagoDTO>>.Success(pagosDto, "Pagos obtenidos correctamente");
    }
}
