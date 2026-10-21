using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Application.Features.Payments.Commands;

public class CreatePagoCommand : IRequest<Response<int>>
{
    public int IdTipoPago { get; set; }
    public DateTime FechaPago { get; set; }
    public decimal ValorPago { get; set; }
    public int? IdCliente { get; set; }
    public DateTime FechaDeposito { get; set; }
    public int IdCuentaBancaria { get; set; }
    public string NumeroDeposito { get; set; }
    public IFormFile Comprobante { get; set; }
    public string? Observaciones { get; set; }
    public int UsuarioRegistro { get; set; }
    public string Cuotas { get; set; }
    public bool DistribuirExcedente { get; set; }
}

public record ValidatePagoCommand : IRequest<Response<int>>
{
    public int IdPago { get; set; }
    public List<PagoCuotaItem>? Cuotas { get; set; } // null indica que se distribuirá automáticamente
    public bool DistribuirExcedente { get; set; } = true;
}

public class CancelPagoCommand : IRequest<Response<int>>
{
    public int IdPago { get; set; }
    public int UsuarioElimino { get; set; }
    public string Observaciones { get; set; }
}

public class AprobarPagoCommand : IRequest<Response<int>>
{
    public int IdPago { get; set; }
    public int UsuarioAprueba { get; set; }
}

public class RechazarPagoCommand : IRequest<Response<int>>
{
    public int IdPago { get; set; }
    public int UsuarioRechaza { get; set; }
    public string? Observaciones { get; set; }
}

public class ActualizarObservacionPagoCommand : IRequest<Response<int>>
{
    public int IdPago { get; set; }
    public string? Observaciones { get; set; }
}

