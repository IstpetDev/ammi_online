using AMMI_Online_API.API.Controllers.Payments;
using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public record ClienteQuery(
    int? IdCliente,
    string? Documento,
    string? Nombres,
    string? Apellidos,
    string? Correo,
    string? Celular,
    string? Direccion,
    bool? Activo
) : IRequest<Response<IEnumerable<ClienteDTO>>>;
