using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class GetAllEspecieCicloHandler
    : IRequestHandler<GetAllEspecieCicloQuery, Response<IEnumerable<EspecieCicloDTO>>>
{
    private readonly IEspecieCicloRepository _repository;

    public GetAllEspecieCicloHandler(IEspecieCicloRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<EspecieCicloDTO>>> Handle(
        GetAllEspecieCicloQuery request,
        CancellationToken cancellationToken)
    {
        var especiesCiclo = await _repository.GetAllAsync(cancellationToken);

        var dtos = especiesCiclo.Select(MapToDTO);

        return new Response<IEnumerable<EspecieCicloDTO>>(dtos);
    }

    private static EspecieCicloDTO MapToDTO(EspecieCiclo ec) => new()
    {
        IdEspecieCiclo = ec.IdEspecieCiclo,
        IdMalla = ec.IdMalla,
        IdEspecie = ec.IdEspecie,
        ValorEspecie = ec.ValorEspecie,
        DetalleMalla = ec.IdMallaNavigation?.Detalle ?? string.Empty,
        DetalleEspecie = ec.IdEspecieNavigation?.Detalle ?? string.Empty,
        EsPension = ec.IdEspecieNavigation?.EsPension ?? false,
        EsMatricula = ec.IdEspecieNavigation?.EsMatricula ?? false,
        CicloActivo = ec.IdMallaNavigation?.IdCicloNavigation?.EsActivo ?? false
    };
}

public class GetEspecieCicloByMallaHandler
    : IRequestHandler<GetEspecieCicloByMallaQuery, Response<IEnumerable<EspecieCicloDTO>>>
{
    private readonly IEspecieCicloRepository _repository;

    public GetEspecieCicloByMallaHandler(IEspecieCicloRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<EspecieCicloDTO>>> Handle(
        GetEspecieCicloByMallaQuery request,
        CancellationToken cancellationToken)
    {
        var especiesCiclo = await _repository.GetByMallaAsync(request.IdMalla, cancellationToken);

        var dtos = especiesCiclo.Select(ec => new EspecieCicloDTO
        {
            IdEspecieCiclo = ec.IdEspecieCiclo,
            IdMalla = ec.IdMalla,
            IdEspecie = ec.IdEspecie,
            ValorEspecie = ec.ValorEspecie,
            DetalleMalla = ec.IdMallaNavigation?.Detalle ?? string.Empty,
            DetalleEspecie = ec.IdEspecieNavigation?.Detalle ?? string.Empty,
            EsPension = ec.IdEspecieNavigation?.EsPension ?? false,
            EsMatricula = ec.IdEspecieNavigation?.EsMatricula ?? false,
            CicloActivo = ec.IdMallaNavigation?.IdCicloNavigation?.EsActivo ?? false
        });

        return new Response<IEnumerable<EspecieCicloDTO>>(dtos);
    }
}

public class GetEspecieCicloByIdHandler
    : IRequestHandler<GetEspecieCicloByIdQuery, Response<EspecieCicloDTO>>
{
    private readonly IEspecieCicloRepository _repository;

    public GetEspecieCicloByIdHandler(IEspecieCicloRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<EspecieCicloDTO>> Handle(
        GetEspecieCicloByIdQuery request,
        CancellationToken cancellationToken)
    {
        var especieCiclo = await _repository.GetByIdAsync(request.IdEspecieCiclo, cancellationToken);

        if (especieCiclo == null)
        {
            return Response<EspecieCicloDTO>.Failure("EspecieCiclo no encontrado");
        }

        var dto = new EspecieCicloDTO
        {
            IdEspecieCiclo = especieCiclo.IdEspecieCiclo,
            IdMalla = especieCiclo.IdMalla,
            IdEspecie = especieCiclo.IdEspecie,
            ValorEspecie = especieCiclo.ValorEspecie,
            DetalleMalla = especieCiclo.IdMallaNavigation?.Detalle ?? string.Empty,
            DetalleEspecie = especieCiclo.IdEspecieNavigation?.Detalle ?? string.Empty,
            EsPension = especieCiclo.IdEspecieNavigation?.EsPension ?? false,
            EsMatricula = especieCiclo.IdEspecieNavigation?.EsMatricula ?? false,
            CicloActivo = especieCiclo.IdMallaNavigation?.IdCicloNavigation?.EsActivo ?? false
        };

        return new Response<EspecieCicloDTO>(dto);
    }
}

public class CreateEspecieCicloHandler
    : IRequestHandler<CreateEspecieCicloCommand, Response<EspecieCicloDTO>>
{
    private readonly IEspecieCicloRepository _repository;
    private readonly IInfraestructuraValidationService _validationService;
    private readonly Domain.Interfaces.Infrastructure.IMallaRepository _mallaRepository;

    public CreateEspecieCicloHandler(
        IEspecieCicloRepository repository,
        IInfraestructuraValidationService validationService,
        Domain.Interfaces.Infrastructure.IMallaRepository mallaRepository)
    {
        _repository = repository;
        _validationService = validationService;
        _mallaRepository = mallaRepository;
    }

    public async Task<Response<EspecieCicloDTO>> Handle(
        CreateEspecieCicloCommand request,
        CancellationToken cancellationToken)
    {
        // Validar que la malla tenga ciclo activo
        var mallaActiva = await _repository.EsMallaConCicloActivoAsync(request.IdMalla, cancellationToken);
        if (!mallaActiva)
        {
            return Response<EspecieCicloDTO>.Failure(
                "Solo se puede crear EspecieCiclo en mallas cuyo ciclo esté activo");
        }

        // Si ya existe la misma especie en la malla, procedemos a actualizar su valor
        var existentes = await _repository.GetByMallaAsync(request.IdMalla, cancellationToken);
        var existente = existentes.FirstOrDefault(ec => ec.IdEspecie == request.IdEspecie);
        if (existente != null)
        {
            // Validar valor positivo
            if (request.ValorEspecie <= 0)
            {
                return Response<EspecieCicloDTO>.Failure(
                    "El valor de la especie debe ser mayor a 0");
            }

            // Obtener malla para acceder al ciclo y validar matriculados
            var malla = await _mallaRepository.GetByIdAsync(request.IdMalla, cancellationToken);
            if (malla == null)
            {
                return Response<EspecieCicloDTO>.Failure("La malla asociada no existe");
            }

            // Bloquear si el ciclo ya tiene alumnos matriculados
            var (esValido, mensajeValidacion) = await _validationService
                .ValidarCicloSinMatriculadosAsync(malla.IdCiclo, cancellationToken);
            if (!esValido)
                return Response<EspecieCicloDTO>.Failure(mensajeValidacion);

            var updated = await _repository.UpdateValorAsync(
                existente.IdEspecieCiclo,
                request.IdEspecie,
                request.ValorEspecie,
                cancellationToken);

            var dtoUpdated = new EspecieCicloDTO
            {
                IdEspecieCiclo = updated.IdEspecieCiclo,
                IdMalla = updated.IdMalla,
                IdEspecie = updated.IdEspecie,
                ValorEspecie = updated.ValorEspecie,
                DetalleMalla = updated.IdMallaNavigation?.Detalle ?? string.Empty,
                DetalleEspecie = updated.IdEspecieNavigation?.Detalle ?? string.Empty,
                EsPension = updated.IdEspecieNavigation?.EsPension ?? false,
                EsMatricula = updated.IdEspecieNavigation?.EsMatricula ?? false,
                CicloActivo = updated.IdMallaNavigation?.IdCicloNavigation?.EsActivo ?? false
            };

            return Response<EspecieCicloDTO>.Success(dtoUpdated, "EspecieCiclo actualizado correctamente");
        }

        // Validar valor positivo
        if (request.ValorEspecie <= 0)
        {
            return Response<EspecieCicloDTO>.Failure(
                "El valor de la especie debe ser mayor a 0");
        }

        var especieCiclo = new EspecieCiclo
        {
            IdMalla = request.IdMalla,
            IdEspecie = request.IdEspecie,
            ValorEspecie = request.ValorEspecie
        };

        var created = await _repository.CreateAsync(especieCiclo, cancellationToken);

        var dto = new EspecieCicloDTO
        {
            IdEspecieCiclo = created.IdEspecieCiclo,
            IdMalla = created.IdMalla,
            IdEspecie = created.IdEspecie,
            ValorEspecie = created.ValorEspecie,
            DetalleMalla = created.IdMallaNavigation?.Detalle ?? string.Empty,
            DetalleEspecie = created.IdEspecieNavigation?.Detalle ?? string.Empty,
            EsPension = created.IdEspecieNavigation?.EsPension ?? false,
            EsMatricula = created.IdEspecieNavigation?.EsMatricula ?? false,
            CicloActivo = created.IdMallaNavigation?.IdCicloNavigation?.EsActivo ?? false
        };

        return Response<EspecieCicloDTO>.Success(dto, "EspecieCiclo creado correctamente");
    }
}

public class UpdateEspecieCicloValorHandler
    : IRequestHandler<UpdateEspecieCicloValorCommand, Response<EspecieCicloDTO>>
{
    private readonly IEspecieCicloRepository _repository;
    private readonly IInfraestructuraValidationService _validationService;
    private readonly Domain.Interfaces.Infrastructure.IMallaRepository _mallaRepository;

    public UpdateEspecieCicloValorHandler(
        IEspecieCicloRepository repository,
        IInfraestructuraValidationService validationService,
        Domain.Interfaces.Infrastructure.IMallaRepository mallaRepository)
    {
        _repository = repository;
        _validationService = validationService;
        _mallaRepository = mallaRepository;
    }

    public async Task<Response<EspecieCicloDTO>> Handle(
        UpdateEspecieCicloValorCommand request,
        CancellationToken cancellationToken)
    {
        // Validar que exista
        var existing = await _repository.GetByIdAsync(request.IdEspecieCiclo, cancellationToken);
        if (existing == null)
        {
            return Response<EspecieCicloDTO>.Failure("EspecieCiclo no encontrado");
        }

        // Obtener malla para acceder al ciclo y validar matriculados
        var malla = await _mallaRepository.GetByIdAsync(existing.IdMalla, cancellationToken);
        if (malla == null)
        {
            return Response<EspecieCicloDTO>.Failure("La malla asociada no existe");
        }

        // Bloquear si el ciclo ya tiene alumnos matriculados
        var (esValido, mensajeValidacion) = await _validationService
            .ValidarCicloSinMatriculadosAsync(malla.IdCiclo, cancellationToken);
        if (!esValido)
            return Response<EspecieCicloDTO>.Failure(mensajeValidacion);

        // Validar que no exista otra especie igual en la misma malla (si cambió la especie)
        if (request.IdEspecie != existing.IdEspecie)
        {
            var existeEspecie = await _repository.ExisteEspecieEnMallaAsync(
                existing.IdMalla,
                request.IdEspecie,
                cancellationToken);

            if (existeEspecie)
            {
                return Response<EspecieCicloDTO>.Failure(
                    "Ya existe esta especie en la malla seleccionada");
            }
        }

        // Validar valor positivo
        if (request.ValorEspecie <= 0)
        {
            return Response<EspecieCicloDTO>.Failure(
                "El valor de la especie debe ser mayor a 0");
        }

        var updated = await _repository.UpdateValorAsync(
            request.IdEspecieCiclo,
            request.IdEspecie,
            request.ValorEspecie,
            cancellationToken);

        var dto = new EspecieCicloDTO
        {
            IdEspecieCiclo = updated.IdEspecieCiclo,
            IdMalla = updated.IdMalla,
            IdEspecie = updated.IdEspecie,
            ValorEspecie = updated.ValorEspecie,
            DetalleMalla = updated.IdMallaNavigation?.Detalle ?? string.Empty,
            DetalleEspecie = updated.IdEspecieNavigation?.Detalle ?? string.Empty,
            EsPension = updated.IdEspecieNavigation?.EsPension ?? false,
            EsMatricula = updated.IdEspecieNavigation?.EsMatricula ?? false,
            CicloActivo = updated.IdMallaNavigation?.IdCicloNavigation?.EsActivo ?? false
        };

        return Response<EspecieCicloDTO>.Success(dto, "EspecieCiclo actualizado correctamente");
    }
}
