using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class EliminarPostulacionHandler : IRequestHandler<EliminarPostulacionCommand, Response<bool>>
{
    private readonly IPostulacionRepository _postulacionRepository;

    public EliminarPostulacionHandler(IPostulacionRepository postulacionRepository)
    {
        _postulacionRepository = postulacionRepository;
    }

    public async Task<Response<bool>> Handle(EliminarPostulacionCommand request, CancellationToken cancellationToken)
    {
        var result = await _postulacionRepository.EliminarPostulacionAsync(request.IdPostulacion, cancellationToken);
        if (!result)
        {
            return Response<bool>.Failure("No se encontró la postulación a eliminar o no pudo ser eliminada.");
        }
        return Response<bool>.Success(true, "Postulación y datos asociados eliminados correctamente.");
    }
}
