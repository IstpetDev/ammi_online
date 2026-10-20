using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
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
        IdCiclo = ec.IdCiclo,
        IdEspecie = ec.IdEspecie,
        ValorEspecie = ec.ValorEspecie,
        DetalleCiclo = ec.IdCicloNavigation?.Detalle ?? string.Empty,
        DetalleEspecie = ec.IdEspecieNavigation?.Detalle ?? string.Empty,
        EsDiferible = ec.IdEspecieNavigation?.EsDiferible ?? false,
        CicloActivo = ec.IdCicloNavigation?.EsActivo ?? false
    };
}

public class GetEspecieCicloByCicloHandler
    : IRequestHandler<GetEspecieCicloByCicloQuery, Response<IEnumerable<EspecieCicloDTO>>>
{
    private readonly IEspecieCicloRepository _repository;

    public GetEspecieCicloByCicloHandler(IEspecieCicloRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<EspecieCicloDTO>>> Handle(
        GetEspecieCicloByCicloQuery request,
        CancellationToken cancellationToken)
    {
        var especiesCiclo = await _repository.GetByCicloAsync(request.IdCiclo, cancellationToken);

        var dtos = especiesCiclo.Select(ec => new EspecieCicloDTO
        {
            IdEspecieCiclo = ec.IdEspecieCiclo,
            IdCiclo = ec.IdCiclo,
            IdEspecie = ec.IdEspecie,
            ValorEspecie = ec.ValorEspecie,
            DetalleCiclo = ec.IdCicloNavigation?.Detalle ?? string.Empty,
            DetalleEspecie = ec.IdEspecieNavigation?.Detalle ?? string.Empty,
            EsDiferible = ec.IdEspecieNavigation?.EsDiferible ?? false,
            CicloActivo = ec.IdCicloNavigation?.EsActivo ?? false
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
            IdCiclo = especieCiclo.IdCiclo,
            IdEspecie = especieCiclo.IdEspecie,
            ValorEspecie = especieCiclo.ValorEspecie,
            DetalleCiclo = especieCiclo.IdCicloNavigation?.Detalle ?? string.Empty,
            DetalleEspecie = especieCiclo.IdEspecieNavigation?.Detalle ?? string.Empty,
            EsDiferible = especieCiclo.IdEspecieNavigation?.EsDiferible ?? false,
            CicloActivo = especieCiclo.IdCicloNavigation?.EsActivo ?? false
        };

        return new Response<EspecieCicloDTO>(dto);
    }
}

public class CreateEspecieCicloHandler
    : IRequestHandler<CreateEspecieCicloCommand, Response<EspecieCicloDTO>>
{
    private readonly IEspecieCicloRepository _repository;

    public CreateEspecieCicloHandler(IEspecieCicloRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<EspecieCicloDTO>> Handle(
        CreateEspecieCicloCommand request,
        CancellationToken cancellationToken)
    {
        // Validar que el ciclo sea activo
        var cicloActivo = await _repository.EsCicloActivoAsync(request.IdCiclo, cancellationToken);
        if (!cicloActivo)
        {
            return Response<EspecieCicloDTO>.Failure(
                "Solo se puede crear EspecieCiclo en ciclos activos");
        }

        // Validar que no exista la misma especie en el ciclo
        var existeEspecie = await _repository.ExisteEspecieEnCicloAsync(
            request.IdCiclo,
            request.IdEspecie,
            cancellationToken);

        if (existeEspecie)
        {
            return Response<EspecieCicloDTO>.Failure(
                "Ya existe esta especie en el ciclo seleccionado");
        }

        // Validar valor positivo
        if (request.ValorEspecie <= 0)
        {
            return Response<EspecieCicloDTO>.Failure(
                "El valor de la especie debe ser mayor a 0");
        }

        var especieCiclo = new EspecieCiclo
        {
            IdCiclo = request.IdCiclo,
            IdEspecie = request.IdEspecie,
            ValorEspecie = request.ValorEspecie
        };

        var created = await _repository.CreateAsync(especieCiclo, cancellationToken);

        var dto = new EspecieCicloDTO
        {
            IdEspecieCiclo = created.IdEspecieCiclo,
            IdCiclo = created.IdCiclo,
            IdEspecie = created.IdEspecie,
            ValorEspecie = created.ValorEspecie,
            DetalleCiclo = created.IdCicloNavigation?.Detalle ?? string.Empty,
            DetalleEspecie = created.IdEspecieNavigation?.Detalle ?? string.Empty,
            EsDiferible = created.IdEspecieNavigation?.EsDiferible ?? false,
            CicloActivo = created.IdCicloNavigation?.EsActivo ?? false
        };

        return Response<EspecieCicloDTO>.Success(dto, "EspecieCiclo creado correctamente");
    }
}

public class UpdateEspecieCicloValorHandler
    : IRequestHandler<UpdateEspecieCicloValorCommand, Response<EspecieCicloDTO>>
{
    private readonly IEspecieCicloRepository _repository;

    public UpdateEspecieCicloValorHandler(IEspecieCicloRepository repository)
    {
        _repository = repository;
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

        // Validar valor positivo
        if (request.ValorEspecie <= 0)
        {
            return Response<EspecieCicloDTO>.Failure(
                "El valor de la especie debe ser mayor a 0");
        }

        var updated = await _repository.UpdateValorAsync(
            request.IdEspecieCiclo,
            request.ValorEspecie,
            cancellationToken);

        var dto = new EspecieCicloDTO
        {
            IdEspecieCiclo = updated.IdEspecieCiclo,
            IdCiclo = updated.IdCiclo,
            IdEspecie = updated.IdEspecie,
            ValorEspecie = updated.ValorEspecie,
            DetalleCiclo = updated.IdCicloNavigation?.Detalle ?? string.Empty,
            DetalleEspecie = updated.IdEspecieNavigation?.Detalle ?? string.Empty,
            EsDiferible = updated.IdEspecieNavigation?.EsDiferible ?? false,
            CicloActivo = updated.IdCicloNavigation?.EsActivo ?? false
        };

        return Response<EspecieCicloDTO>.Success(dto, "Valor actualizado correctamente");
    }
}
