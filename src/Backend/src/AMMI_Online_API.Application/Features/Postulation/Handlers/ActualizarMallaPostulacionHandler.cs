using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class ActualizarMallaPostulacionHandler : IRequestHandler<ActualizarMallaPostulacionCommand, Response<int>>
{
    private readonly IPostulacionRepository _postulacionRepository;

    public ActualizarMallaPostulacionHandler(IPostulacionRepository postulacionRepository)
    {
        _postulacionRepository = postulacionRepository;
    }

    public async Task<Response<int>> Handle(ActualizarMallaPostulacionCommand request, CancellationToken cancellationToken)
    {
        var postulacion = await _postulacionRepository.GetPostulacionByIdAsync(request.IdPostulacion, cancellationToken);
        if (postulacion == null)
            return Response<int>.Failure("Postulación no encontrada.");

        if (postulacion.IdTipoEstadoAprobacion == 4 || 
            postulacion.IdTipoEstadoAprobacion == 5 || 
            postulacion.IdTipoEstadoAprobacion == 6)
        {
            return Response<int>.Failure("No se puede actualizar la malla porque el estado de la postulación no permite modificaciones.");
        }

        var result = await _postulacionRepository.UpdateMallaAsync(request.IdPostulacion, request.Dto.IdMalla, cancellationToken);

        if (result > 0)
        {
            return Response<int>.Success(request.IdPostulacion, "Malla actualizada correctamente.");
        }

        return Response<int>.Failure("No se pudo actualizar la malla.");
    }
}
