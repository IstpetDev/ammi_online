using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Notas;
using MediatR;

namespace AMMI_Online_API.Application.Features.Notas.Commands;

public record CreateNotaAlumnoCommand(int IdDetalleMatricula, int IdPlantillaEstructura, decimal ValorNota, string? Observacion) : IRequest<Response<int>>;
public record UpdateNotaAlumnoCommand(int IdNotasAlumno, decimal ValorNota, string? Observacion) : IRequest<Response<bool>>;
public record DeleteNotaAlumnoCommand(int IdNotasAlumno) : IRequest<Response<bool>>;
public record CreateNotasMasivasCommand(NotasMasivasDTO Data) : IRequest<Response<bool>>;
public record RecalcularNotasCommand(int IdDetalleMatricula) : IRequest<Response<bool>>;
