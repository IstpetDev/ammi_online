using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateBeneficioCommand(BeneficioCreateDTO Beneficio) : IRequest<BeneficioDTO>;
public record UpdateBeneficioCommand(BeneficioUpdateDTO Beneficio) : IRequest<BeneficioDTO>;
public record DeleteBeneficioCommand(int Id) : IRequest<bool>;