using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class CreditoSimpleHandler :
    IRequestHandler<GetCreditosSimpleByMatriculaQuery, Response<IEnumerable<CreditoSimpleDTO>>>,
    IRequestHandler<GetDetallesByCreditoQuery, Response<IEnumerable<DetalleCreditoDTO>>>
{
    private readonly ICreditoRepository _repository;

    public CreditoSimpleHandler(ICreditoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<CreditoSimpleDTO>>> Handle(GetCreditosSimpleByMatriculaQuery request, CancellationToken cancellationToken)
    {
        var creditos = await _repository.GetCreditosSimpleByMatriculaAsync(request.IdMatricula, cancellationToken);

        var dtoList = creditos.Select(c =>
        {
            var especie = c.IdEspecieCicloNavigation?.IdEspecieNavigation;
            var esPension = especie?.EsPension ?? false;
            var esMatricula = especie?.EsMatricula ?? false;

            return new CreditoSimpleDTO
            {
                IdCredito = c.IdCredito,
                IdMatricula = c.IdMatricula,
                IdEspecieCiclo = c.IdEspecieCiclo,
                MontoOriginal = c.MontoOriginal,
                MontoFinal = c.MontoFinal,
                SaldoPendiente = c.SaldoPendiente,
                Estado = c.Estado ?? string.Empty,
                ValorEspecie = c.IdEspecieCicloNavigation?.ValorEspecie ?? 0,
                IdEspecie = c.IdEspecieCicloNavigation?.IdEspecie ?? 0,
                DetalleEspecie = especie?.Detalle ?? string.Empty,
                EsDiferible = esPension && !esMatricula,
                EsPension = esPension,
                EsMatricula = esMatricula
            };
        });

        return new Response<IEnumerable<CreditoSimpleDTO>>(dtoList);
    }

    public async Task<Response<IEnumerable<DetalleCreditoDTO>>> Handle(GetDetallesByCreditoQuery request, CancellationToken cancellationToken)
    {
        var detalles = await _repository.GetDetallesByCreditoAsync(request.IdCredito, cancellationToken);

        var dtoList = detalles.Select(d => new DetalleCreditoDTO
        {
            IdDetalleCredito = d.IdDetalleCredito,
            IdCredito = d.IdCredito,
            NumeroCuota = d.NumeroCuota,
            ValorOriginal = d.ValorOriginal,
            SaldoCuota = d.SaldoCuota,
            FechaLimite = d.FechaLimite,
            Estado = d.Estado ?? string.Empty,
            Pagado = d.Pagado
        });

        return new Response<IEnumerable<DetalleCreditoDTO>>(dtoList);
    }
}
