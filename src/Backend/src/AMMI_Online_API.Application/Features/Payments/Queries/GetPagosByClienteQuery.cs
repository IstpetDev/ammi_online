using MediatR;
using AMMI_Online_API.Application.DTOs.Payments;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public class GetPagosByClienteQuery : IRequest<IEnumerable<PagoDTO>>
{
    public string Documento { get; set; }
}