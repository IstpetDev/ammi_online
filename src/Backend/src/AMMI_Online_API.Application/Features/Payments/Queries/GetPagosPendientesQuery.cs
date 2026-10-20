using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;

namespace AMMI_Online_API.Application.Features.Payments.Queries
{
    public record GetPagosPendientesQuery : IRequest<Response<IEnumerable<PagoDTO>>>
    {
        public int? IdMatricula { get; init; }
        public string? Documento { get; init; }
    }
}