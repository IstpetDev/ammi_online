using MediatR;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoDatoContactoCommand(CreateTipoDatoContactoDTO tipoDatoContactoDTO) : IRequest<Response<int>>;
public record UpdateTipoDatoContactoCommand(UpdateTipoDatoContactoDTO tipoDatoContactoDTO) : IRequest<Response<bool>>;
public record DeleteTipoDatoContactoCommand(int IdTipoDatoContacto) : IRequest<Response<bool>>;
