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
    IRequestHandler<GetDetallesMatriculaByParaleloYMateriaQuery, Response<IEnumerable<DetalleMatriculaConAlumnoDTO>>>
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

    public async Task<Response<IEnumerable<DetalleMatriculaConAlumnoDTO>>> Handle(GetDetallesMatriculaByParaleloYMateriaQuery request, CancellationToken ct)
    {
        var result = await _matriculaRepo.GetDetallesMatriculaByParaleloYMateriaAsync(request.IdParalelo, request.IdDetalleMalla, ct);
        var dtos = result.Select(MapToDTO);
        return Response<IEnumerable<DetalleMatriculaConAlumnoDTO>>.Success(dtos, "Detalles obtenidos exitosamente");
    }

    private static DetalleMatriculaConAlumnoDTO MapToDTO(DetalleMatricula entity)
    {
        var persona = entity.IdMatriculaNavigation?.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;
        return new DetalleMatriculaConAlumnoDTO
        {
            IdDetalleMatricula = entity.IdDetalleMatricula,
            IdMatricula = entity.IdMatricula,
            IdDetalleMalla = entity.IdDetalleMalla,
            NombreAlumno = persona != null ? $"{persona.PrimerApellido} {persona.PrimerNombre}" : "Sin Nombre",
            DocumentoAlumno = persona?.Documento ?? string.Empty
        };
    }
}
