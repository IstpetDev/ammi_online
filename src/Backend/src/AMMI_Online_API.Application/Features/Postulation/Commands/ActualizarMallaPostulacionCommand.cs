using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Commands;

public record ActualizarMallaPostulacionCommand(int IdPostulacion, ActualizarMallaPostulacionDTO Dto) : IRequest<Response<int>>;
