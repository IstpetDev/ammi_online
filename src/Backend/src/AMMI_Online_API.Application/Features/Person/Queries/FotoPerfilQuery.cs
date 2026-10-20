using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Queries;

public record GetFotoPerfilByDocumentoQuery(string Documento) : IRequest<Response<FotoPerfilDTO>>;
public record GetFotoPerfilByPersonaIdQuery(int IdPersona) : IRequest<Response<FotoPerfilDTO>>;
