using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetAllBeneficiosQuery() : IRequest<IEnumerable<BeneficioDTO>>;
public record GetBeneficioByIdQuery(int Id) : IRequest<BeneficioDTO>;
public record GetBeneficioByIdEspecie(int IdEspecie) : IRequest<IEnumerable<BeneficioDTO>>;
