using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Domain.Interfaces.Postulations;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public class GetResumenAlumnosContabilidadHandler : IRequestHandler<GetResumenAlumnosContabilidadQuery, Response<IEnumerable<ResumenAlumnoContabilidadDTO>>>
{
    private readonly IMatriculaRepository _matriculaRepository;

    public GetResumenAlumnosContabilidadHandler(IMatriculaRepository matriculaRepository)
    {
        _matriculaRepository = matriculaRepository;
    }

    public async Task<Response<IEnumerable<ResumenAlumnoContabilidadDTO>>> Handle(GetResumenAlumnosContabilidadQuery request, CancellationToken cancellationToken)
    {
        var matriculas = await _matriculaRepository.GetResumenContabilidadAsync(
            request.IdCiclo,
            request.IdCurso,
            request.Documento,
            cancellationToken);

        var resultado = matriculas.Select(m =>
        {
            var persona = m.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;
            var nombreCompleto = $"{persona?.PrimerNombre ?? ""} {persona?.SegundoNombre ?? ""} {persona?.PrimerApellido ?? ""} {persona?.SegundoApellido ?? ""}".Trim();
            var ciclo = m.IdMallaParaleloNavigation?.IdMallaNavigation?.IdCicloNavigation;
            var curso = m.IdMallaParaleloNavigation?.IdMallaNavigation?.IdCursosNavigation;

            decimal saldoPendiente = 0;
            decimal saldoAprobado = 0;
            decimal saldoPendienteAprobacion = 0;
            var pagosPendientesVistos = new System.Collections.Generic.HashSet<int>();

            foreach (var credito in m.Credito)
            {
                // Saldo pendiente: suma del saldo de todos los créditos activos
                if (credito.Estado != "PAGADO" && credito.Estado != "CANCELADO")
                {
                    saldoPendiente += credito.SaldoPendiente;
                }

                if (credito.DetalleCredito != null)
                {
                    foreach (var detalle in credito.DetalleCredito)
                    {
                        if (detalle.PagoCuota != null)
                        {
                            foreach (var pagoCuota in detalle.PagoCuota)
                            {
                                var pago = pagoCuota.IdPagoNavigation;
                                if (pago != null)
                                {
                                    var estadoPago = pago.IdEstadoPagoNavigation?.Detalle ?? "";

                                    if (estadoPago == "APROBADO")
                                    {
                                        saldoAprobado += pagoCuota.ValorAplicado;
                                    }
                                    else if (estadoPago == "PENDIENTE")
                                    {
                                        if (pagosPendientesVistos.Add(pago.IdPago))
                                        {
                                            saldoPendienteAprobacion += pago.ValorPago;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return new ResumenAlumnoContabilidadDTO
            {
                IdPersona = persona?.IdPersona ?? 0,
                IdMatricula = m.IdMatricula,
                Documento = persona?.Documento ?? "",
                NombreCompleto = nombreCompleto,
                NombreCiclo = ciclo?.Detalle ?? "",
                NombreCurso = curso?.Detalle ?? "",
                SaldoPendiente = saldoPendiente,
                SaldoAprobado = saldoAprobado,
                SaldoPendienteAprobacion = saldoPendienteAprobacion
            };
        }).ToList();

        return new Response<IEnumerable<ResumenAlumnoContabilidadDTO>>(resultado);
    }
}
