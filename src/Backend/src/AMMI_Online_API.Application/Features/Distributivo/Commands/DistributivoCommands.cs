using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Distributive;
using MediatR;

namespace AMMI_Online_API.Application.Features.Distributivo.Commands;

public record CreateDistributivoCommand(DistributivoCreateDTO Data) : IRequest<Response<int>>;
public record UpdateDistributivoCommand(DistributivoUpdateDTO Data) : IRequest<Response<bool>>;
public record DeleteDistributivoCommand(int Id) : IRequest<Response<bool>>;
public record CreateDistributivoMasivoCommand(DistributivoMasivoDTO Data) : IRequest<Response<bool>>;
