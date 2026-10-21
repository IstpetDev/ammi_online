using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Queries;

public class GetPersonaPostulacionQuery : IRequest<Response<PaginatedResult<PersonaPostulacionDTO>>>
{
    public string? Documento { get; set; }
    public int? IdCiclo { get; set; }
    public int? IdMalla { get; set; }
    public int? IdOferta { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public bool ExcludeContactoPersona { get; set; } = false;

    public GetPersonaPostulacionQuery() { }

    public GetPersonaPostulacionQuery(
        string? documento = null,
        int? idCiclo = null,
        int? idMalla = null,
        int? idOferta = null,
        int pageNumber = 1,
        int pageSize = 10,
        bool excludeContactoPersona = false)
    {
        Documento = documento;
        IdCiclo = idCiclo;
        IdMalla = idMalla;
        IdOferta = idOferta;
        PageNumber = pageNumber;
        PageSize = pageSize;
        ExcludeContactoPersona = excludeContactoPersona;
    }
}