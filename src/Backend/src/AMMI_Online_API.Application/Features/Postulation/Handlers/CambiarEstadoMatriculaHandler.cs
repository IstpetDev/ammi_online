using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;


namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class CambiarEstadoMatriculaHandler : IRequestHandler<CambiarEstadoMatriculaCommand, Response<bool>>
{
    private readonly IMatriculaRepository _matriculaRepository;
    private readonly IEstadoMatriculaRepository _estadoMatriculaRepository;

    public CambiarEstadoMatriculaHandler(
        IMatriculaRepository matriculaRepository,
        IEstadoMatriculaRepository estadoMatriculaRepository)
    {
        _matriculaRepository = matriculaRepository;
        _estadoMatriculaRepository = estadoMatriculaRepository;
    }

    public async Task<Response<bool>> Handle(CambiarEstadoMatriculaCommand request, CancellationToken cancellationToken)
    {
        var matricula = await _matriculaRepository.GetByIdWithDetailsAsync(request.IdMatricula, cancellationToken);
        if (matricula == null)
            return Response<bool>.Failure("La matrícula no existe.");

        var nuevoEstado = await _estadoMatriculaRepository.GetByIdAsync(request.IdEstadoMatricula, cancellationToken);
        if (nuevoEstado == null)
            return Response<bool>.Failure("El estado de matrícula especificado no existe.");

        // Regla: No se puede volver atrás de un estado con Completado = true
        if (matricula.IdEstadoMatriculaNavigation?.Completado == true && nuevoEstado.Completado == false)
        {
            return Response<bool>.Failure("No se puede revertir una matrícula que ya ha sido finalizada o retirada.");
        }

        await _matriculaRepository.ActualizarEstadoMatriculaAsync(request.IdMatricula, request.IdEstadoMatricula, cancellationToken);

        return Response<bool>.Success(true, $"Estado de matrícula actualizado a '{nuevoEstado.Detalle}' correctamente.");
    }
}
