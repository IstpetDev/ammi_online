using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateEtniaCommand(string Nombre, bool? Default) : IRequest<Response<int>>;
public record UpdateEtniaCommand(int IdEtnia, string Nombre, bool? Default) : IRequest<Response<bool>>;
public record DeleteEtniaCommand(int IdEtnia) : IRequest<Response<bool>>;
