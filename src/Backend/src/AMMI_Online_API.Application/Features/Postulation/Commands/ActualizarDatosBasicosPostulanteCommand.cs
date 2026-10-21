using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Commands;

public record ActualizarDatosBasicosPostulanteCommand(int IdPostulacion, ActualizarDatosBasicosPostulanteDTO Dto) : IRequest<Response<bool>>;
