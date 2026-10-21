using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Adjuntos;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;
using System.Text.Json;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class CreatePagoCreditoHandler : IRequestHandler<CreatePagoCommand, Response<int>>
{
    private readonly IPagoCreditoRepository _pagoCreditoRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IAdjuntos _adjuntoRepository;

    public CreatePagoCreditoHandler(
        IPagoCreditoRepository pagoCreditoRepository,
        IAdjuntos adjuntoRepository)
    {
        _pagoCreditoRepository = pagoCreditoRepository;
        _adjuntoRepository = adjuntoRepository;
    }

    public async Task<Response<int>> Handle(CreatePagoCommand request, CancellationToken cancellationToken)
    {
        if (request.Comprobante == null || request.Comprobante.Length == 0)
            throw new Exception("El comprobante es obligatorio.");

        var adjunto = await _adjuntoRepository.GuardarArchivoAsync(request.Comprobante, "Comprobantes", cancellationToken);

        var pago = new Pago
        {
            IdTipoPago = request.IdTipoPago,
            IdCliente = request.IdCliente,
            IdEstadoPago = 1,
            FechaPago = request.FechaPago,
            ValorPago = request.ValorPago,
            FechaDeposito = request.FechaDeposito,
            IdCuentaBancaria = request.IdCuentaBancaria,
            NumeroDeposito = request.NumeroDeposito,
            Observaciones = request.Observaciones,
            FechaRegistro = DateTime.Now,
            UrlComprobante = adjunto.IdAdjunto,
            UsuarioRegistro = request.UsuarioRegistro
        };

        List<PagoCuotaItem> cuotas = new();

        if (!string.IsNullOrEmpty(request.Cuotas))
        {
            try
            {
                cuotas = JsonSerializer.Deserialize<List<PagoCuotaItem>>(request.Cuotas,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                    ?? new List<PagoCuotaItem>();
            }
            catch (JsonException)
            {
                try
                {
                    var cuotaIndividual = JsonSerializer.Deserialize<PagoCuotaItem>(request.Cuotas,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    
                    if (cuotaIndividual != null)
                    {
                        cuotas = new List<PagoCuotaItem> { cuotaIndividual };
                    }
                }
                catch (JsonException ex)
                {
                    throw new Exception($"El formato del campo 'Cuotas' no es válido. Debe ser un array JSON válido. Valor recibido: '{request.Cuotas}'", ex);
                }
            }
        }

        var pagoCuotas = cuotas.Select(c => new PagoCuota
        {
            IdDetalleCredito = c.IdDetalleCredito,
            ValorAplicado = 0
        }).ToList();

        int idPago = await _pagoCreditoRepository.CrearPagoPendienteSinDistribucionAsync(
            pago,
            pagoCuotas,
            cancellationToken);

        return Response<int>.Success(idPago, "Pago creado correctamente. Pendiente de aprobación por Secretaría General.");
    }
}

public class ValidatePagoHandler : IRequestHandler<ValidatePagoCommand, Response<int>>
{
    private readonly IPagoCreditoRepository _pagoCreditoRepository;

    public ValidatePagoHandler(IPagoCreditoRepository pagoCreditoRepository)
    {
        _pagoCreditoRepository = pagoCreditoRepository;
    }

    public async Task<Response<int>> Handle(ValidatePagoCommand request, CancellationToken cancellationToken)
    {
        List<PagoCuota>? cuotas = null;
        if (request.Cuotas != null)
        {
            cuotas = request.Cuotas.Select(item => new PagoCuota
            {
                IdDetalleCredito = item.IdDetalleCredito,
                ValorAplicado = item.ValorAplicado ?? 0
            }).ToList();
        }

        await _pagoCreditoRepository.AplicarDistribucionAPagoAsync(
            request.IdPago,
            cuotas,
            request.DistribuirExcedente,
            cancellationToken);

        return Response<int>.Success(request.IdPago, "Pago validado y distribuido correctamente");
    }
}


public class CancelPagoHandler : IRequestHandler<CancelPagoCommand, Response<int>>
{
    private readonly IPagoCreditoRepository _pagoCreditoRepository;
    private readonly IEmailService _emailService;

    public CancelPagoHandler(
        IPagoCreditoRepository pagoCreditoRepository,
        IEmailService emailService)
    {
        _pagoCreditoRepository = pagoCreditoRepository;
        _emailService = emailService;
    }

    public async Task<Response<int>> Handle(CancelPagoCommand request, CancellationToken cancellationToken)
    {
        var pago = await _pagoCreditoRepository.ObtenerPagoConDetallesCompletosAsync(request.IdPago, cancellationToken);
        if (pago == null)
            throw new Exception($"El pago con ID {request.IdPago} no existe.");

        await _pagoCreditoRepository.CancelarPagoAsync(request.IdPago, request.UsuarioElimino, request.Observaciones, cancellationToken);

        // Enviar notificación por correo en segundo plano
        _ = Task.Run(async () =>
        {
            try
            {
                await PagoEmailNotificationHelper.EnviarNotificacionPagoAsync(
                    _emailService,
                    pago,
                    "ANULADO",
                    request.Observaciones);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CancelPagoHandler] ❌ Error al enviar correo de anulación de pago: {ex.Message}");
            }
        });

        return Response<int>.Success(request.IdPago, "Pago cancelado correctamente");
    }
}

public class AprobarPagoHandler : IRequestHandler<AprobarPagoCommand, Response<int>>
{
    private readonly IPagoCreditoRepository _pagoCreditoRepository;
    private readonly IEmailService _emailService;

    public AprobarPagoHandler(
        IPagoCreditoRepository pagoCreditoRepository,
        IEmailService emailService)
    {
        _pagoCreditoRepository = pagoCreditoRepository;
        _emailService = emailService;
    }

    public async Task<Response<int>> Handle(AprobarPagoCommand request, CancellationToken cancellationToken)
    {
        var pago = await _pagoCreditoRepository.ObtenerPagoConDetallesCompletosAsync(request.IdPago, cancellationToken);
        if (pago == null)
            throw new Exception($"El pago con ID {request.IdPago} no existe.");

        if (pago.IdEstadoPago != 1)
            throw new Exception("Solo se pueden aprobar pagos en estado PENDIENTE.");

        // Aplicar distribución Y cambiar estado a APROBADO en una sola transacción atómica
        await _pagoCreditoRepository.AplicarDistribucionAPagoAsync(
            request.IdPago,
            null,
            true,
            cancellationToken,
            aprobarPago: true,
            usuarioAprueba: request.UsuarioAprueba);

        // Enviar notificación por correo en segundo plano
        _ = Task.Run(async () =>
        {
            try
            {
                await PagoEmailNotificationHelper.EnviarNotificacionPagoAsync(
                    _emailService,
                    pago,
                    "APROBADO",
                    null);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AprobarPagoHandler] ❌ Error al enviar correo de aprobación de pago: {ex.Message}");
            }
        });

        return Response<int>.Success(request.IdPago, "Pago aprobado correctamente");
    }
}

public class RechazarPagoHandler : IRequestHandler<RechazarPagoCommand, Response<int>>
{
    private readonly IPagoCreditoRepository _pagoCreditoRepository;
    private readonly IEmailService _emailService;

    public RechazarPagoHandler(
        IPagoCreditoRepository pagoCreditoRepository,
        IEmailService emailService)
    {
        _pagoCreditoRepository = pagoCreditoRepository;
        _emailService = emailService;
    }

    public async Task<Response<int>> Handle(RechazarPagoCommand request, CancellationToken cancellationToken)
    {
        var pago = await _pagoCreditoRepository.ObtenerPagoConDetallesCompletosAsync(request.IdPago, cancellationToken);
        if (pago == null)
            throw new Exception($"El pago con ID {request.IdPago} no existe.");

        await _pagoCreditoRepository.RechazarPagoAsync(request.IdPago, request.Observaciones, cancellationToken);

        // Enviar notificación por correo en segundo plano
        _ = Task.Run(async () =>
        {
            try
            {
                await PagoEmailNotificationHelper.EnviarNotificacionPagoAsync(
                    _emailService,
                    pago,
                    "RECHAZADO",
                    request.Observaciones);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[RechazarPagoHandler] ❌ Error al enviar correo de rechazo de pago: {ex.Message}");
            }
        });

        return Response<int>.Success(request.IdPago, "Pago rechazado correctamente");
    }
}

public class ActualizarObservacionPagoHandler : IRequestHandler<ActualizarObservacionPagoCommand, Response<int>>
{
    private readonly IPagoCreditoRepository _pagoCreditoRepository;

    public ActualizarObservacionPagoHandler(IPagoCreditoRepository pagoCreditoRepository)
    {
        _pagoCreditoRepository = pagoCreditoRepository;
    }

    public async Task<Response<int>> Handle(ActualizarObservacionPagoCommand request, CancellationToken cancellationToken)
    {
        await _pagoCreditoRepository.ActualizarObservacionAsync(request.IdPago, request.Observaciones, cancellationToken);
        return Response<int>.Success(request.IdPago, "Observación actualizada correctamente");
    }
}

internal static class PagoEmailNotificationHelper
{
    public static async Task EnviarNotificacionPagoAsync(
        IEmailService emailService,
        Pago pago,
        string estado,
        string? observaciones)
    {
        var (email, nombre, concepto) = ExtraerDatosEstudiante(pago);
        if (string.IsNullOrWhiteSpace(email))
        {
            Console.WriteLine($"[PagoEmailNotificationHelper] ⚠️ No se encontró correo para el pago #{pago.IdPago}");
            return;
        }

        var copias = new List<string>();
        if (!string.IsNullOrWhiteSpace(emailService.AdminEmail))
        {
            copias.Add(emailService.AdminEmail.Trim());
        }

        string asunto;
        string badgeText;
        string titulo;
        string mensajePrincipal;
        string bloqueExtra = string.Empty;

        var banco = pago.IdCuentaBancariaNavigation?.Banco ?? "Cuenta Institucional";
        var formaPago = pago.IdTipoPagoNavigation?.Detalle ?? "Transferencia / Depósito";
        var montoFormatted = pago.ValorPago.ToString("N2");
        var fechaStr = pago.FechaDeposito.ToString("dd/MM/yyyy");
        var comprobanteStr = !string.IsNullOrWhiteSpace(pago.NumeroDeposito) ? pago.NumeroDeposito : "N/A";

        if (estado == "APROBADO")
        {
            asunto = $"¡Pago Aprobado! (${montoFormatted}) - AMMI Online";
            badgeText = "Pago Aprobado";
            titulo = "¡Tu Pago ha sido Aprobado!";
            mensajePrincipal = $"Hola <strong>{nombre}</strong>, te confirmamos que tu comprobante de pago por un valor de <strong>${montoFormatted}</strong> ha sido revisado y <strong>aprobado con éxito</strong> por el departamento financiero.";
            
            bloqueExtra = $@"
                <p style='font-size: 13.5px; color: #555; margin-top: 15px;'>El monto ha sido aplicado a tu cuenta estudiantil. Puedes ingresar al portal <strong>AMMI Online</strong> para revisar tu estado de cuenta actualizado.</p>";
        }
        else if (estado == "RECHAZADO")
        {
            asunto = $"Comprobante de Pago No Aprobado - AMMI Online";
            badgeText = "Pago Rechazado";
            titulo = "Estado de tu Comprobante de Pago";
            mensajePrincipal = $"Hola <strong>{nombre}</strong>, te informamos que el comprobante de pago registrado por <strong>${montoFormatted}</strong> no pudo ser aprobado por nuestro departamento financiero.";

            var obsTexto = !string.IsNullOrWhiteSpace(observaciones)
                ? observaciones
                : "El comprobante no coincide con los registros bancarios o no es legible.";

            bloqueExtra = $@"
                <div style='background-color: #FFFDF0; border: 1px solid #F5E6A3; border-left: 4px solid #E9B902; padding: 16px 20px; margin: 20px 0; border-radius: 6px;'>
                    <h4 style='margin-top: 0; color: #1D1E1C; font-size: 14px; margin-bottom: 6px;'>Motivo / Observación:</h4>
                    <p style='margin: 0; font-size: 13.5px; color: #363636;'>{obsTexto}</p>
                </div>
                <p style='font-size: 13.5px; color: #555;'>Por favor ingresa al portal para volver a cargar tu comprobante corregido o comunícate con el área financiera si requieres asistencia.</p>";
        }
        else // ANULADO
        {
            asunto = $"Notificación de Pago Anulado - AMMI Online";
            badgeText = "Pago Anulado";
            titulo = "Notificación de Pago Anulado";
            mensajePrincipal = $"Hola <strong>{nombre}</strong>, te informamos que el registro de pago por <strong>${montoFormatted}</strong> (Comprobante: {comprobanteStr}) ha sido <strong>anulado</strong> del sistema.";

            if (!string.IsNullOrWhiteSpace(observaciones))
            {
                bloqueExtra = $@"
                    <div style='background-color: #FFFDF0; border: 1px solid #F5E6A3; border-left: 4px solid #E9B902; padding: 16px 20px; margin: 20px 0; border-radius: 6px;'>
                        <h4 style='margin-top: 0; color: #1D1E1C; font-size: 14px; margin-bottom: 6px;'>Motivo de anulación:</h4>
                        <p style='margin: 0; font-size: 13.5px; color: #363636;'>{observaciones}</p>
                    </div>";
            }
        }

        var cuerpo = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1D1E1C; margin: 0; padding: 0; background-color: #F4F6F9; }}
        .wrapper {{ width: 100%; padding: 30px 0; background-color: #F4F6F9; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border-top: 5px solid #E9B902; }}
        .header {{ background-color: #1D1E1C; color: #FFFFFF; padding: 35px 25px; text-align: center; }}
        .badge {{ display: inline-block; background-color: #E9B902; color: #1D1E1C; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; }}
        .header h1 {{ margin: 0; font-size: 23px; font-weight: 700; color: #FFFFFF; }}
        .header p {{ margin: 6px 0 0 0; color: #FCEA1E; font-size: 13px; font-weight: 500; letter-spacing: 0.5px; }}
        .content {{ padding: 35px 30px; }}
        .transaction-card {{ background-color: #FAFAFA; border: 1px solid #E9ECEF; border-radius: 8px; padding: 20px; margin: 25px 0; }}
        .transaction-title {{ font-size: 14px; font-weight: 700; color: #1D1E1C; margin-top: 0; margin-bottom: 14px; border-bottom: 1px solid #E9ECEF; padding-bottom: 8px; }}
        .detail-row {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px; }}
        .detail-label {{ color: #6c757d; font-weight: 500; }}
        .detail-value {{ color: #1D1E1C; font-weight: 600; text-align: right; }}
        .amount-highlight {{ font-size: 20px; font-weight: 700; color: #1D1E1C; text-align: center; padding: 12px; background-color: #FFFDF0; border: 1px solid #F5E6A3; border-radius: 6px; margin: 15px 0; }}
        .footer {{ text-align: center; padding: 25px 20px; font-size: 12px; color: #888888; background-color: #FAFAFA; border-top: 1px solid #EEEEEE; }}
        .signature {{ margin-top: 30px; border-top: 1px solid #EEEEEE; padding-top: 15px; font-size: 13.5px; color: #555; }}
    </style>
</head>
<body>
    <div class='wrapper'>
        <div class='container'>
            <div class='header'>
                <div class='badge'>{badgeText}</div>
                <h1>{titulo}</h1>
                <p>AMMI ONLINE &bull; DEPARTAMENTO FINANCIERO</p>
            </div>
            <div class='content'>
                <p>{mensajePrincipal}</p>
                
                <div class='amount-highlight'>
                    Monto: ${montoFormatted} USD
                </div>

                <table style='width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13.5px;'>
                    <tr style='border-bottom: 1px solid #F0F0F0;'>
                        <td style='padding: 8px 0; color: #6c757d;'>N° de Comprobante:</td>
                        <td style='padding: 8px 0; font-weight: 600; text-align: right; color: #1D1E1C;'>{comprobanteStr}</td>
                    </tr>
                    <tr style='border-bottom: 1px solid #F0F0F0;'>
                        <td style='padding: 8px 0; color: #6c757d;'>Forma de Pago:</td>
                        <td style='padding: 8px 0; font-weight: 600; text-align: right; color: #1D1E1C;'>{formaPago}</td>
                    </tr>
                    <tr style='border-bottom: 1px solid #F0F0F0;'>
                        <td style='padding: 8px 0; color: #6c757d;'>Banco / Cuenta:</td>
                        <td style='padding: 8px 0; font-weight: 600; text-align: right; color: #1D1E1C;'>{banco}</td>
                    </tr>
                    <tr style='border-bottom: 1px solid #F0F0F0;'>
                        <td style='padding: 8px 0; color: #6c757d;'>Fecha del Depósito:</td>
                        <td style='padding: 8px 0; font-weight: 600; text-align: right; color: #1D1E1C;'>{fechaStr}</td>
                    </tr>
                    <tr>
                        <td style='padding: 8px 0; color: #6c757d;'>Concepto:</td>
                        <td style='padding: 8px 0; font-weight: 600; text-align: right; color: #1D1E1C;'>{concepto}</td>
                    </tr>
                </table>

                {bloqueExtra}

                <div class='signature'>
                    Atentamente,<br>
                    <strong style='color: #1D1E1C;'>Departamento de Tesorería y Colecturía</strong><br>
                    <span>AMMI Online</span>
                </div>
            </div>
            <div class='footer'>
                <p style='margin: 0 0 5px 0;'>&copy; {DateTime.Now.Year} AMMI Online. Todos los derechos reservados.</p>
                <p style='margin: 0;'>Este es un correo automático, por favor no responder a este mensaje.</p>
            </div>
        </div>
    </div>
</body>
</html>";

        await emailService.SendEmailWithCcAsync(
            email,
            asunto,
            cuerpo,
            copias.Count > 0 ? copias : null,
            true);
    }

    private static (string? email, string nombre, string concepto) ExtraerDatosEstudiante(Pago pago)
    {
        string? email = null;
        string nombre = "Estudiante";

        // 1. Intentar desde IdClienteNavigation
        if (pago.IdClienteNavigation != null)
        {
            if (!string.IsNullOrWhiteSpace(pago.IdClienteNavigation.Correo))
                email = pago.IdClienteNavigation.Correo.Trim();

            var nom = $"{pago.IdClienteNavigation.Nombres} {pago.IdClienteNavigation.Apellidos}".Trim();
            if (!string.IsNullOrWhiteSpace(nom))
                nombre = nom;
        }

        // 2. Si no hay correo, intentar desde la Matrícula / Persona
        var persona = pago.PagoCuota?
            .Select(pc => pc.IdDetalleCreditoNavigation?.IdCreditoNavigation?.IdMatriculaNavigation?.IdUsuarioAlumnoNavigation?.IdPersonaNavigation)
            .FirstOrDefault(p => p != null);

        if (persona != null)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                email = persona.DatosContacto?
                    .FirstOrDefault(dc => (dc.IdTipoDatoContacto == 1 || (dc.Detalle != null && dc.Detalle.Contains("@"))) && !string.IsNullOrWhiteSpace(dc.Detalle))?.Detalle?.Trim();
            }

            if (nombre == "Estudiante")
            {
                var nom = $"{persona.PrimerNombre} {persona.PrimerApellido}".Trim();
                if (!string.IsNullOrWhiteSpace(nom))
                    nombre = nom;
            }
        }

        // 3. Conceptos / Cuotas
        var conceptos = pago.PagoCuota?
            .Select(pc => pc.IdDetalleCreditoNavigation?.IdCreditoNavigation?.IdEspecieCicloNavigation?.IdEspecieNavigation?.Detalle 
                          ?? (pc.IdDetalleCreditoNavigation != null ? $"Cuota #{pc.IdDetalleCreditoNavigation.NumeroCuota}" : null))
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct()
            .ToList();

        string conceptoStr = (conceptos != null && conceptos.Count > 0)
            ? string.Join(", ", conceptos)
            : "Cuota académica / Servicios";

        return (email, nombre, conceptoStr);
    }
}
