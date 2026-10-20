using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateMateriaCommand(string Detalle, decimal HorasRequeridas, DateOnly FechaCreacion, bool EsActivo) : IRequest<Response<int>>;
public record UpdateMateriaCommand(int IdMateria, string Detalle, decimal HorasRequeridas, DateOnly FechaCreacion, bool EsActivo) : IRequest<Response<bool>>;
public record DeleteMateriaCommand(int IdMateria) : IRequest<Response<bool>>;
