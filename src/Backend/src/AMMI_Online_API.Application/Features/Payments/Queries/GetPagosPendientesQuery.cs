using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;

namespace AMMI_Online_API.Application.Features.Payments.Queries
{
    public record GetPagosPendientesQuery : IRequest<Response<IEnumerable<PagoDTO>>>
    {
        public int? IdMatricula { get; set; }
        public string? DocumentoCliente { get; set; }
        public string? DocumentoAlumno { get; set; }
    }
}