using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateRequisitosCommand(RequisitosCreateDTO Requisitos) : IRequest<RequisitosDTO>;

public record UpdateRequisitosCommand(RequisitosUpdateDTO Requisitos) : IRequest<RequisitosDTO>;

public record DeleteRequisitosCommand(int Id) : IRequest<bool>;
