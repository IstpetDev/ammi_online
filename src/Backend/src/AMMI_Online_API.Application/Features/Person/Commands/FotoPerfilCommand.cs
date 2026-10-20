using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Application.Features.Person.Commands;

public record UpdateFotoPerfilCommand(int IdDocumentosPersonales, IFormFile Archivo) : IRequest<Response<FotoPerfilDTO>>;
public record DeleteFotoPerfilCommand(int IdDocumentosPersonales) : IRequest<Response<bool>>;
public record DeleteFotoPerfilAdminByDocumentoCommand(string Documento) : IRequest<Response<bool>>;
public record DeleteFotoPerfilAdminByPersonaIdCommand(int IdPersona) : IRequest<Response<bool>>;
