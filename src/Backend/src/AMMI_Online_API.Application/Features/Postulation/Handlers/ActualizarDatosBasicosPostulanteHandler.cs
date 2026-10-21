using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class ActualizarDatosBasicosPostulanteHandler : IRequestHandler<ActualizarDatosBasicosPostulanteCommand, Response<bool>>
{
    private readonly IPostulacionRepository _postulacionRepository;

    public ActualizarDatosBasicosPostulanteHandler(IPostulacionRepository postulacionRepository)
    {
        _postulacionRepository = postulacionRepository;
    }

    public async Task<Response<bool>> Handle(ActualizarDatosBasicosPostulanteCommand request, CancellationToken cancellationToken)
    {
        var result = await _postulacionRepository.ActualizarDatosBasicosPostulanteAsync(
            request.IdPostulacion,
            request.Dto.PrimerNombre,
            request.Dto.SegundoNombre,
            request.Dto.PrimerApellido,
            request.Dto.SegundoApellido,
            request.Dto.Documento,
            request.Dto.FechaNacimiento,
            request.Dto.IdGenero,
            cancellationToken
        );

        if (!result)
        {
            return Response<bool>.Failure("No se pudo actualizar los datos del postulante.");
        }
        return Response<bool>.Success(true, "Datos del postulante actualizados correctamente.");
    }
}
