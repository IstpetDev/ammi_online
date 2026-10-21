using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;
using AMMI_Online_API.Domain.Entities;
using System.Linq;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class GetDetallesMatriculaHandler : 
    IRequestHandler<GetDetalleMatriculaByMatriculaYMateriaQuery, Response<DetalleMatriculaConAlumnoDTO>>,
    IRequestHandler<GetDetallesMatriculaByMallaParaleloYMateriaQuery, Response<IEnumerable<DetalleMatriculaConAlumnoDTO>>>
{
    private readonly IMatriculaRepository _matriculaRepo;

    public GetDetallesMatriculaHandler(IMatriculaRepository matriculaRepo)
    {
        _matriculaRepo = matriculaRepo;
    }

    public async Task<Response<DetalleMatriculaConAlumnoDTO>> Handle(GetDetalleMatriculaByMatriculaYMateriaQuery request, CancellationToken ct)
    {
        var entity = await _matriculaRepo.GetDetalleMatriculaByMatriculaYMateriaAsync(request.IdMatricula, request.IdDetalleMalla, ct);
        
        if (entity == null)
            return Response<DetalleMatriculaConAlumnoDTO>.Failure("Detalle de matrícula no encontrado para esta materia y alumno.");

        return Response<DetalleMatriculaConAlumnoDTO>.Success(MapToDTO(entity), "Detalle encontrado");
    }

    public async Task<Response<IEnumerable<DetalleMatriculaConAlumnoDTO>>> Handle(GetDetallesMatriculaByMallaParaleloYMateriaQuery request, CancellationToken ct)
    {
        var result = await _matriculaRepo.GetDetallesMatriculaByMallaParaleloYMateriaAsync(request.IdMallaParalelo, request.IdDetalleMalla, ct);
        var dtos = result.Select(MapToDTO);
        return Response<IEnumerable<DetalleMatriculaConAlumnoDTO>>.Success(dtos, "Detalles obtenidos exitosamente");
    }

    private static DetalleMatriculaConAlumnoDTO MapToDTO(DetalleMatricula entity)
    {
        var persona = entity.IdMatriculaNavigation?.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;
        var nombreCompleto = persona != null
            ? string.Join(" ", new[] { persona.PrimerApellido, persona.SegundoApellido, persona.PrimerNombre, persona.SegundoNombre }
                .Where(s => !string.IsNullOrWhiteSpace(s))).Trim()
            : "Sin Nombre";

        return new DetalleMatriculaConAlumnoDTO
        {
            IdDetalleMatricula = entity.IdDetalleMatricula,
            IdMatricula = entity.IdMatricula,
            IdDetalleMalla = entity.IdDetalleMalla,
            NombreAlumno = string.IsNullOrWhiteSpace(nombreCompleto) ? "Sin Nombre" : nombreCompleto,
            DocumentoAlumno = persona?.Documento ?? string.Empty
        };
    }
}
