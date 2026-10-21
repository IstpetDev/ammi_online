using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Commands;

public record CreateDetalleMallaCommand(DetalleMallaCreateDTO CreateDto) : IRequest<DetalleMallaDTO>;
public record CreateBulkDetalleMallaCommand(List<DetalleMallaCreateDTO> CreateDtos) : IRequest<IEnumerable<DetalleMallaDTO>>;
public record UpdateDetalleMallaCommand(int Id, DetalleMallaUpdateDTO UpdateDto) : IRequest<DetalleMallaDTO>;
public record ActualizarFechasNotasMateriaCommand(ActualizarFechasNotasMateriaDTO Dto) : IRequest<DetalleMallaDTO>;
public record DeleteDetalleMallaCommand(int Id) : IRequest<bool>;
