using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;
using System.Linq;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class GetPostulacionesHandler : IRequestHandler<GetPostulacionesQuery, Response<IEnumerable<PostulacionDTO>>>
{
    private readonly IPostulacionRepository _repository;

    public GetPostulacionesHandler(IPostulacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<PostulacionDTO>>> Handle(GetPostulacionesQuery request, CancellationToken cancellationToken)
    {
        var postulaciones = await _repository.GetAllPostulacionesWithDetailsAsync(cancellationToken);

        var dtoList = postulaciones.Select(p => {
            var cicloActivo = p.IdMallaNavigation.IdCicloNavigation;

            return new PostulacionDTO
            {
                IdPostulacion = p.IdPostulacion,
                PrimerNombre = p.IdPersonaNavigation.PrimerNombre,
                SegundoNombre = p.IdPersonaNavigation.SegundoNombre,
                PrimerApellido = p.IdPersonaNavigation.PrimerApellido,
                SegundoApellido = p.IdPersonaNavigation.SegundoApellido,
                Documento = p.IdPersonaNavigation.Documento,
                FechaNacimiento = p.IdPersonaNavigation.PersonaInfo?.FechaNacimiento,
                MallaDetalle = p.IdMallaNavigation.Detalle,
                CursoDetalle = p.IdMallaNavigation.IdCursosNavigation.Detalle,
                TipoOfertaDetalle = p.IdMallaNavigation.IdTipoOfertaNavigation.Detalle,
                EstadoDetalle = p.IdTipoEstadoAprobacionNavigation.Detalle,
                CicloActivoDetalle = cicloActivo?.Detalle
            };
        });

        return new Response<IEnumerable<PostulacionDTO>>(dtoList);
    }
}
