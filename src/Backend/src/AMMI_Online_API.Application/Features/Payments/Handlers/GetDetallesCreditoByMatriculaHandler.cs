using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class GetDetallesCreditoByMatriculaHandler : IRequestHandler<GetDetallesCreditoByMatriculaQuery, IEnumerable<DetalleCreditoDTO>>
{
    private readonly ICreditoRepository _repository;

    public GetDetallesCreditoByMatriculaHandler(ICreditoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<DetalleCreditoDTO>> Handle(GetDetallesCreditoByMatriculaQuery request, CancellationToken cancellationToken)
    {
        var detalles = await _repository.GetDetallesCreditoByMatriculaAsync(request.IdMatricula, cancellationToken);

        return detalles.Select(d => new DetalleCreditoDTO
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
    }
}
