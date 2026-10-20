using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetAllNacionalidadEtnicaQuery : IRequest<Response<IEnumerable<NacionalidadEtnicaDTO>>>;
public record GetNacionalidadEtnicaByEtniaQuery(int IdEtnia) : IRequest<Response<IEnumerable<NacionalidadEtnicaDTO>>>;
