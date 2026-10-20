using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class EstudianteBeneficioHandler :
    IRequestHandler<AsignarBeneficioCommand, Response<EstudianteBeneficioDTO>>,
    IRequestHandler<DesactivarBeneficioCommand, Response<bool>>,
    IRequestHandler<GetBeneficiosByAlumnoQuery, Response<IEnumerable<EstudianteBeneficioDTO>>>
{
    private readonly IEstudianteBeneficioRepository _repository;
    private readonly IBeneficioRepository _beneficioRepository;

    public EstudianteBeneficioHandler(
        IEstudianteBeneficioRepository repository,
        IBeneficioRepository beneficioRepository)
    {
        _repository = repository;
        _beneficioRepository = beneficioRepository;
    }

    public async Task<Response<EstudianteBeneficioDTO>> Handle(
        AsignarBeneficioCommand request,
        CancellationToken cancellationToken)
    {
        var dto = request.Data;

        // Validar que el beneficio existe y está activo
        var beneficio = await _beneficioRepository.GetByIdAsync(dto.IdBeneficio, cancellationToken);
        if (beneficio == null || !beneficio.Activo)
            return Response<EstudianteBeneficioDTO>.Failure("El beneficio no existe o está inactivo.");

        // Validar que si RequiereRenovacion = true, el IdCiclo sea obligatorio
        if (beneficio.RequiereRenovacion && dto.IdCiclo == null)
            return Response<EstudianteBeneficioDTO>.Failure(
                "Este beneficio requiere renovación por ciclo. Debe especificar el ciclo.");

        var entity = new EstudianteBeneficio
        {
            IdPersona    = dto.IdPersona,
            IdBeneficio  = dto.IdBeneficio,
            IdCiclo      = dto.IdCiclo,
            FechaInicio  = dto.FechaInicio,
            FechaFin     = dto.FechaFin,
            IdAprobadoPor = dto.IdAprobadoPor,
            Observaciones = dto.Observaciones,
            Activo       = true
        };

        var created = await _repository.AddAsync(entity, cancellationToken);

        return new Response<EstudianteBeneficioDTO>(MapToDTO(created, beneficio));
    }

    public async Task<Response<bool>> Handle(
        DesactivarBeneficioCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(
            request.Data.IdEstudianteBeneficio, cancellationToken);

        if (entity == null)
            return Response<bool>.Failure("Asignación de beneficio no encontrada.");

        entity.Activo = false;
        if (request.Data.Observaciones != null)
            entity.Observaciones = request.Data.Observaciones;

        await _repository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Beneficio desactivado correctamente.");
    }

    public async Task<Response<IEnumerable<EstudianteBeneficioDTO>>> Handle(
        GetBeneficiosByAlumnoQuery request,
        CancellationToken cancellationToken)
    {
        var entities = await _repository.GetByAlumnoAsync(request.IdPersona, cancellationToken);
        var result = entities.Select(eb => MapToDTO(eb, eb.IdBeneficioNavigation));
        return new Response<IEnumerable<EstudianteBeneficioDTO>>(result);
    }

    private static EstudianteBeneficioDTO MapToDTO(EstudianteBeneficio eb, Beneficio b) =>
        new()
        {
            IdEstudianteBeneficio = eb.IdEstudianteBeneficio,
            IdPersona             = eb.IdPersona,
            IdBeneficio           = eb.IdBeneficio,
            DetalleBeneficio      = b.Detalle,
            TipoValor             = b.TipoValor,
            Valor                 = b.Valor,
            IdCiclo               = eb.IdCiclo,
            FechaAsignacion       = eb.FechaAsignacion,
            FechaInicio           = eb.FechaInicio,
            FechaFin              = eb.FechaFin,
            IdAprobadoPor         = eb.IdAprobadoPor,
            Observaciones         = eb.Observaciones,
            Activo                = eb.Activo
        };
}
