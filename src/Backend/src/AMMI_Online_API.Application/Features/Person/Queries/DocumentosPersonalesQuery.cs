using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Queries;

public record GetByDocumentosPersonalesQuery
    (
    int? IdDocumentosPersonales,
    int? IdTipoDocumentoPersonal,
    int? IdPersona,
    int? IdAdjunto,
    string? CodigoRequisito,
    bool? Estado,
    bool? ValorDato,
    string? Observacion
    ) : IRequest<Response<IEnumerable<DocumentosPersonalesDTO>>>;
public record GetAllDocumentosPersonalesQuery : IRequest<Response<IEnumerable<DocumentosPersonalesDTO>>>;