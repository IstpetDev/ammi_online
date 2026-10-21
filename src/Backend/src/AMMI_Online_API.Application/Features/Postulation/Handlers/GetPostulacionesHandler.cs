using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;
using System.Collections.Generic;
using System.Linq;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class GetPostulacionesHandler : IRequestHandler<GetPostulacionesQuery, Response<PaginatedResult<PostulacionDTO>>>
{
    private readonly IPostulacionRepository _repository;
    private readonly IMallaRequisitosRepository _mallaRequisitosRepository;

    public GetPostulacionesHandler(
        IPostulacionRepository repository,
        IMallaRequisitosRepository mallaRequisitosRepository)
    {
        _repository = repository;
        _mallaRequisitosRepository = mallaRequisitosRepository;
    }

    private const int IdEstadoAprobado = 4;

    public async Task<Response<PaginatedResult<PostulacionDTO>>> Handle(GetPostulacionesQuery request, CancellationToken cancellationToken)
    {
        var postulaciones = await _repository.GetPostulacionesFilteredWithDetailsAsync(
            request.IdCiclo, request.IdMalla, request.IdTipoEstadoAprobacion, request.Search, cancellationToken);

        if (request.ExcludeContactoPersona)
        {
            const int IdEstadoContactoPersona = 8;
            postulaciones = postulaciones.Where(p => p.IdTipoEstadoAprobacion != IdEstadoContactoPersona);
        }

        // Si no se filtra explícitamente por estado aprobado, se excluyen los aprobados que YA pagaron la matrícula
        // (los aprobados sin pago, pago por validar o valor faltante de matrícula se mantienen para seguimiento)
        if (!request.IdTipoEstadoAprobacion.HasValue)
        {
            postulaciones = postulaciones.Where(p => p.IdTipoEstadoAprobacion != IdEstadoAprobado || !ObtenerEstadoMatricula(p).MatriculaPagada);
        }

        // Ordenar alfabéticamente por apellidos y nombres
        postulaciones = postulaciones
            .OrderBy(p => p.IdPersonaNavigation.PrimerApellido ?? string.Empty)
            .ThenBy(p => p.IdPersonaNavigation.SegundoApellido ?? string.Empty)
            .ThenBy(p => p.IdPersonaNavigation.PrimerNombre ?? string.Empty)
            .ThenBy(p => p.IdPersonaNavigation.SegundoNombre ?? string.Empty);

        var totalCount = postulaciones.Count();

        var paginadas = postulaciones
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        // Precargar de manera directa y robusta los requisitos para las mallas de la página actual
        var mallasIds = paginadas
            .Where(p => p.IdMalla.HasValue && p.IdMalla.Value > 0)
            .Select(p => p.IdMalla!.Value)
            .Distinct()
            .ToList();

        var requisitosPorMalla = new Dictionary<int, List<MallaRequisitos>>();
        foreach (var idMalla in mallasIds)
        {
            var reqs = await _mallaRequisitosRepository.GetByMallaIdAsync(idMalla, cancellationToken);
            requisitosPorMalla[idMalla] = reqs.ToList();
        }

        var dtoList = paginadas.Select(p => {
            var malla = p.IdMallaNavigation;

            int totalObligatorios = 0;
            int subidosSinRevisar = 0;
            int subidosAprobados = 0;
            int subidosRechazados = 0;
            string estadoRequisitos = "INCOMPLETO";
            bool tienePendientes = false;
            var pendientesNombres = new List<string>();

            // Obtener los requisitos de la malla desde el repositorio o fallback a la navegación
            List<MallaRequisitos> mallaRequisitos = new();
            if (p.IdMalla.HasValue && requisitosPorMalla.TryGetValue(p.IdMalla.Value, out var reqs))
            {
                mallaRequisitos = reqs;
            }
            else if (malla?.MallaRequisitos != null && malla.MallaRequisitos.Any())
            {
                mallaRequisitos = malla.MallaRequisitos.ToList();
            }

            if (mallaRequisitos.Any())
            {
                var requisitosObligatorios = mallaRequisitos
                    .Where(mr => mr.IdRequisitosNavigation != null && mr.IdRequisitosNavigation.EsObligatorio)
                    .ToList();

                var docsList = (p.IdPersonaNavigation?.DocumentosPersonales ?? Enumerable.Empty<DocumentosPersonales>())
                    .Where(d => !string.IsNullOrWhiteSpace(d.CodigoRequisito))
                    .ToList();

                foreach (var mr in requisitosObligatorios)
                {
                    var codReq = mr.IdRequisitos.ToString();
                    var reqNombre = mr.IdRequisitosNavigation?.Detalle ?? $"Requisito #{mr.IdRequisitos}";
                    var esBool = string.Equals(mr.IdRequisitosNavigation?.TipoDato, "BOOL", StringComparison.OrdinalIgnoreCase) || mr.IdRequisitosNavigation?.EsMayorEdad == true;
                    var doc = docsList.LastOrDefault(d => d.CodigoRequisito != null && d.CodigoRequisito.Trim() == codReq);

                    if (esBool)
                    {
                        // Para booleanos: siempre están por validar a menos que estén explícitamente aprobados o rechazados
                        if (doc == null || doc.Estado == null)
                        {
                            pendientesNombres.Add($"{reqNombre} (Por validar)");
                        }
                        else if (doc.Estado == false)
                        {
                            pendientesNombres.Add($"{reqNombre} (Rechazado)");
                        }
                        // Si doc.Estado == true: está aprobado, no se añade a pendientes
                    }
                    else
                    {
                        // Para adjuntos / archivos: debe tener archivo subido para considerarse 'Por revisar'
                        bool tieneArchivoSubido = doc != null && ((doc.IdAdjunto.HasValue && doc.IdAdjunto.Value > 0) || doc.IdAdjuntoNavigation != null);

                        if (!tieneArchivoSubido)
                        {
                            pendientesNombres.Add($"{reqNombre} (Falta subir)");
                        }
                        else if (doc.Estado == false)
                        {
                            pendientesNombres.Add($"{reqNombre} (Rechazado)");
                        }
                        else if (doc.Estado == null)
                        {
                            pendientesNombres.Add($"{reqNombre} (Por revisar)");
                        }
                        // Si doc.Estado == true: está aprobado, no se añade a pendientes
                    }
                }

                totalObligatorios = requisitosObligatorios.Count;
                var codigosRequisitosSet = requisitosObligatorios.Select(r => r.IdRequisitos.ToString()).ToHashSet();
                var documentosObligatorios = docsList
                    .Where(d => d.CodigoRequisito != null && codigosRequisitosSet.Contains(d.CodigoRequisito.Trim()))
                    .ToList();

                subidosSinRevisar = documentosObligatorios.Count(d => d.Estado == null && ((d.IdAdjunto.HasValue && d.IdAdjunto.Value > 0) || d.IdAdjuntoNavigation != null));
                subidosAprobados = documentosObligatorios.Count(d => d.Estado == true);
                subidosRechazados = documentosObligatorios.Count(d => d.Estado == false);

                var totalPendientesCalculados = totalObligatorios - subidosAprobados;
                if (totalPendientesCalculados < 0) totalPendientesCalculados = 0;

                if (totalObligatorios > 0 && subidosAprobados == totalObligatorios)
                {
                    estadoRequisitos = "TODOS_APROBADOS";
                }
                else if (subidosSinRevisar > 0)
                {
                    estadoRequisitos = "PENDIENTE_REVISION";
                }
                else if (subidosRechazados > 0 || subidosAprobados < totalObligatorios)
                {
                    estadoRequisitos = "REVISADOS_SIN_APROBAR";
                }

                tienePendientes = totalPendientesCalculados > 0 || pendientesNombres.Count > 0;
            }

            var cicloActivo = malla?.IdCicloNavigation;
            var estadoMat = ObtenerEstadoMatricula(p);

            return new PostulacionDTO
            {
                IdPostulacion = p.IdPostulacion,
                PrimerNombre = p.IdPersonaNavigation.PrimerNombre,
                SegundoNombre = p.IdPersonaNavigation.SegundoNombre,
                PrimerApellido = p.IdPersonaNavigation.PrimerApellido,
                SegundoApellido = p.IdPersonaNavigation.SegundoApellido,
                Documento = p.IdPersonaNavigation.Documento,
                FechaNacimiento = p.IdPersonaNavigation.PersonaInfo?.FechaNacimiento,
                MallaDetalle = malla?.Detalle ?? string.Empty,
                CursoDetalle = malla?.IdCursosNavigation?.Detalle ?? string.Empty,
                TipoOfertaDetalle = malla?.IdCicloNavigation?.IdTipoOfertaNavigation?.Detalle ?? string.Empty,
                EstadoDetalle = p.IdTipoEstadoAprobacionNavigation?.Detalle ?? string.Empty,
                CicloActivoDetalle = cicloActivo?.Detalle,
                TieneRequisitosPendientes = tienePendientes,
                EstadoRequisitos = estadoRequisitos,
                TotalRequisitosObligatorios = totalObligatorios,
                TotalSubidosSinRevisar = subidosSinRevisar,
                TotalSubidosAprobados = subidosAprobados,
                TotalSubidosRechazados = subidosRechazados,
                TotalRequisitosPendientes = pendientesNombres.Count,
                RequisitosPendientesNombres = pendientesNombres,
                ObservacionesRevision = p.ObservacionesRevision,
                MatriculaPagada = estadoMat.MatriculaPagada,
                TieneMatriculaGenerada = estadoMat.TieneMatricula,
                EstadoPagoMatricula = estadoMat.EstadoPagoMatricula,
                MontoTotalMatricula = estadoMat.MontoTotal,
                SaldoPendienteMatricula = estadoMat.SaldoPendiente,
                MontoPagadoMatricula = estadoMat.MontoPagado
            };
        }).ToList();

        var result = new PaginatedResult<PostulacionDTO>(dtoList, totalCount, request.PageNumber, request.PageSize);
        return new Response<PaginatedResult<PostulacionDTO>>(result);
    }

    private record EstadoMatriculaCalculado(
        bool TieneMatricula,
        bool MatriculaPagada,
        string EstadoPagoMatricula,
        decimal MontoTotal,
        decimal SaldoPendiente,
        decimal MontoPagado
    );

    private static EstadoMatriculaCalculado ObtenerEstadoMatricula(Postulacion p)
    {
        var matriculas = p.IdPersonaNavigation?.Usuario?.Matricula;
        if (matriculas == null || !matriculas.Any())
        {
            return new EstadoMatriculaCalculado(false, false, "SIN_PAGO", 0, 0, 0);
        }

        var matricula = matriculas.FirstOrDefault(m =>
            (p.IdMalla.HasValue && m.IdMallaParaleloNavigation != null && m.IdMallaParaleloNavigation.IdMalla == p.IdMalla.Value) ||
            (p.IdMallaNavigation != null && p.IdMallaNavigation.IdCiclo != 0 && m.DetalleMatricula.Any(dm => dm.IdDetalleMallaNavigation != null && dm.IdDetalleMallaNavigation.IdMallaNavigation != null && dm.IdDetalleMallaNavigation.IdMallaNavigation.IdCiclo == p.IdMallaNavigation.IdCiclo))
        ) ?? matriculas.LastOrDefault();

        if (matricula == null)
        {
            return new EstadoMatriculaCalculado(false, false, "SIN_PAGO", 0, 0, 0);
        }

        var creditoMatricula = matricula.Credito?
            .FirstOrDefault(c => c.IdEspecieCicloNavigation?.IdEspecieNavigation?.EsMatricula == true
                              || (c.IdEspecieCicloNavigation?.IdEspecieNavigation?.Detalle != null && c.IdEspecieCicloNavigation.IdEspecieNavigation.Detalle.Contains("Matricula", StringComparison.OrdinalIgnoreCase)));

        if (creditoMatricula == null)
        {
            return new EstadoMatriculaCalculado(true, false, "SIN_PAGO", 0, 0, 0);
        }

        decimal montoTotal = creditoMatricula.MontoFinal ?? creditoMatricula.MontoOriginal;
        decimal saldoPendiente = creditoMatricula.SaldoPendiente;

        // 1. Verificar si la matrícula está totalmente pagada / liquidada
        bool pagada = saldoPendiente <= 0
            || string.Equals(creditoMatricula.Estado, "CANCELADO", StringComparison.OrdinalIgnoreCase)
            || string.Equals(creditoMatricula.Estado, "PAGADO", StringComparison.OrdinalIgnoreCase)
            || (creditoMatricula.DetalleCredito != null && creditoMatricula.DetalleCredito.Any() && creditoMatricula.DetalleCredito.All(dc => dc.Pagado || (dc.SaldoCuota.HasValue && dc.SaldoCuota.Value <= 0)));

        if (pagada)
        {
            return new EstadoMatriculaCalculado(true, true, "PAGADO", montoTotal, 0, montoTotal);
        }

        // Obtener todos los pagos asociados a las cuotas de matrícula (excluyendo eliminados/anulados)
        var pagosCuota = creditoMatricula.DetalleCredito?
            .SelectMany(dc => dc.PagoCuota ?? Enumerable.Empty<PagoCuota>())
            .Where(pc => pc.IdPagoNavigation != null && pc.IdPagoNavigation.FechaEliminacion == null)
            .ToList() ?? new List<PagoCuota>();

        // 2. Verificar si hay pagos registrados pendientes de validación (IdEstadoPago == 1 / Pendiente)
        bool tienePagoPendienteValidacion = pagosCuota.Any(pc =>
            pc.IdPagoNavigation.IdEstadoPago == 1 ||
            string.Equals(pc.IdPagoNavigation.IdEstadoPagoNavigation?.Detalle, "PENDIENTE", StringComparison.OrdinalIgnoreCase)
        );

        if (tienePagoPendienteValidacion)
        {
            decimal montoAbonado = Math.Max(0, montoTotal - saldoPendiente);
            return new EstadoMatriculaCalculado(true, false, "PAGO_POR_VALIDAR", montoTotal, saldoPendiente, montoAbonado);
        }

        // 3. Si no hay pagos por validar, verificar si hay un pago parcial aprobado (saldo pendiente menor al total o cuotas con abono o pagos aprobados)
        bool tienePagoParcialAprobado = saldoPendiente < montoTotal && saldoPendiente > 0;
        if (!tienePagoParcialAprobado)
        {
            tienePagoParcialAprobado = pagosCuota.Any(pc =>
                pc.IdPagoNavigation.IdEstadoPago == 2 ||
                string.Equals(pc.IdPagoNavigation.IdEstadoPagoNavigation?.Detalle, "APROBADO", StringComparison.OrdinalIgnoreCase)
            );
        }

        if (tienePagoParcialAprobado)
        {
            decimal montoAbonado = Math.Max(0, montoTotal - saldoPendiente);
            return new EstadoMatriculaCalculado(true, false, "VALOR_FALTANTE", montoTotal, saldoPendiente, montoAbonado);
        }

        // 4. Sin ningún pago registrado
        return new EstadoMatriculaCalculado(true, false, "SIN_PAGO", montoTotal, saldoPendiente, 0);
    }
}
