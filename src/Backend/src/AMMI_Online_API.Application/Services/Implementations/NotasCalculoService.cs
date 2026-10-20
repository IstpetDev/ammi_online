using AMMI_Online_API.Application.DTOs.Notas;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Domain.Interfaces.Notas;
using AMMI_Online_API.Domain.Interfaces.Postulations;

namespace AMMI_Online_API.Application.Services.Implementations;

public class NotasCalculoService : INotasCalculoService
{
    private readonly IPlantillaEstructuraRepository _plantillaRepo;
    private readonly IReglasCalculoRepository _reglasRepo;
    private readonly INotasAlumnoRepository _notasRepo;
    private readonly IMatriculaRepository _matriculaRepo;

    public NotasCalculoService(
        IPlantillaEstructuraRepository plantillaRepo,
        IReglasCalculoRepository reglasRepo,
        INotasAlumnoRepository notasRepo,
        IMatriculaRepository matriculaRepo)
    {
        _plantillaRepo = plantillaRepo;
        _reglasRepo = reglasRepo;
        _notasRepo = notasRepo;
        _matriculaRepo = matriculaRepo;
    }

    public async Task<decimal?> CalcularNotaCompuestaAsync(
        int idPlantillaEstructura,
        int idDetalleMatricula,
        CancellationToken ct)
    {
        var hijos = await _plantillaRepo.GetHijosAsync(idPlantillaEstructura, ct);

        if (!hijos.Any())
        {
            var nota = await _notasRepo.GetNotaByDetalleMatriculaAsync(idPlantillaEstructura, idDetalleMatricula, ct);
            return nota?.ValorNota;
        }

        var notasHijos = new List<(decimal? nota, decimal peso)>();
        foreach (var hijo in hijos)
        {
            var notaHijo = await CalcularNotaCompuestaAsync(hijo.IdPlantillaEstructura, idDetalleMatricula, ct);
            notasHijos.Add((notaHijo, hijo.Peso));
        }

        if (notasHijos.Any(n => n.nota == null))
            return null;

        var regla = await _reglasRepo.GetByPlantillaEstructuraAsync(idPlantillaEstructura, ct);
        var tipoRegla = regla?.IdTipoReglaCalculoNavigation?.Detalle ?? "PromedioPonderado";

        decimal resultado = tipoRegla switch
        {
            "Suma" => notasHijos.Sum(n => n.nota!.Value),
            "Promedio" => notasHijos.Any() ? notasHijos.Average(n => n.nota!.Value) : 0,
            "PromedioPonderado" => CalcularPromedioPonderado(notasHijos),
            "Minimo" => notasHijos.Min(n => n.nota!.Value),
            "Maximo" => notasHijos.Max(n => n.nota!.Value),
            _ => CalcularPromedioPonderado(notasHijos)
        };

        await _notasRepo.UpsertAsync(idPlantillaEstructura, idDetalleMatricula, resultado, "Calculado automaticamente", ct);

        return resultado;
    }

    public async Task PropagarCalculoAsync(
        int idPlantillaEstructura,
        int idDetalleMatricula,
        CancellationToken ct)
    {
        var nodo = await _plantillaRepo.GetByIdAsync(idPlantillaEstructura, ct);
        if (nodo == null) return;

        if (nodo.IdNodoPadre.HasValue)
        {
            await CalcularNotaCompuestaAsync(nodo.IdNodoPadre.Value, idDetalleMatricula, ct);
            await PropagarCalculoAsync(nodo.IdNodoPadre.Value, idDetalleMatricula, ct);
        }
        else
        {
            // Nodo raíz alcanzado: sincronizar DetalleMatricula
            await SincronizarDetalleMatriculaAsync(idDetalleMatricula, ct);
        }
    }

    public async Task RecalcularTodasAsync(
        int idDetalleMatricula,
        CancellationToken ct)
    {
        var dm = await _matriculaRepo.GetDetalleMatriculaByIdAsync(idDetalleMatricula, ct);
        if (dm?.IdDetalleMallaNavigation == null) return;

        var idPlantillaEvaluacion = dm.IdDetalleMallaNavigation.IdPlantillaEvaluacion;
        var estructura = await _plantillaRepo.GetByPlantillaIdAsync(idPlantillaEvaluacion, ct);
        var roots = estructura.Where(x => x.IdNodoPadre == null);

        foreach (var nodo in roots)
        {
            await CalcularNotaCompuestaAsync(nodo.IdPlantillaEstructura, idDetalleMatricula, ct);
        }

        await SincronizarDetalleMatriculaAsync(idDetalleMatricula, ct);
    }

    public async Task SincronizarDetalleMatriculaAsync(int idDetalleMatricula, CancellationToken ct)
    {
        var dm = await _matriculaRepo.GetDetalleMatriculaByIdAsync(idDetalleMatricula, ct);
        if (dm?.IdDetalleMallaNavigation == null) return;

        var idPlantillaEvaluacion = dm.IdDetalleMallaNavigation.IdPlantillaEvaluacion;
        var estructura = await _plantillaRepo.GetByPlantillaIdAsync(idPlantillaEvaluacion, ct);
        var nodoRaiz = estructura.FirstOrDefault(e => e.IdNodoPadre == null);
        if (nodoRaiz == null) return;

        var notaRaiz = await _notasRepo.GetNotaByDetalleMatriculaAsync(nodoRaiz.IdPlantillaEstructura, idDetalleMatricula, ct);
        if (notaRaiz?.ValorNota == null) return;

        var regla = await _reglasRepo.GetByPlantillaEstructuraAsync(nodoRaiz.IdPlantillaEstructura, ct);
        var notaMinimaAprobar = regla?.NotaMinimaAprobar ?? 7.0m;

        decimal notaEfectiva;
        bool aprobado;

        if (dm.ExamenRemedial.HasValue)
        {
            if (dm.ExamenRemedial.Value >= notaMinimaAprobar)
            {
                notaEfectiva = notaMinimaAprobar;
                aprobado = true;
            }
            else
            {
                notaEfectiva = notaRaiz.ValorNota.Value;
                aprobado = false;
            }
        }
        else
        {
            notaEfectiva = notaRaiz.ValorNota.Value;
            aprobado = notaRaiz.ValorNota.Value >= notaMinimaAprobar;
        }

        await _matriculaRepo.ActualizarResultadoDetalleMatriculaAsync(idDetalleMatricula, notaEfectiva, aprobado, ct);
    }

    public async Task<BoletinAlumnoDTO> GetBoletinAsync(
        int idMatricula,
        CancellationToken ct)
    {
        var matricula = await _matriculaRepo.GetByIdForBoletinAsync(idMatricula, ct);
        if (matricula == null) throw new KeyNotFoundException("Matricula no encontrada");

        var persona = matricula.IdUsuarioAlumnoNavigation?.IdPersonaNavigation;
        var nombreAlumno = persona != null
            ? $"{persona.PrimerNombre} {persona.PrimerApellido}".Trim()
            : string.Empty;

        var materias = new List<BoletinMateriaDTO>();

        foreach (var dm in matricula.DetalleMatricula)
        {
            var idPlantillaEvaluacion = dm.IdDetalleMallaNavigation?.IdPlantillaEvaluacion ?? 0;
            if (idPlantillaEvaluacion == 0) continue;

            var estructura = await _plantillaRepo.GetByPlantillaIdAsync(idPlantillaEvaluacion, ct);
            var notasList = await _notasRepo.GetByDetalleMatriculaAsync(dm.IdDetalleMatricula, ct);
            var notasByEstructura = notasList.ToDictionary(n => n.IdPlantillaEstructura);

            var byPadre = estructura.ToLookup(e => e.IdNodoPadre);
            var raices = byPadre[null].OrderBy(e => e.Orden).ToList();

            var estado = dm.Aprobado == true ? "Aprobado"
                       : dm.Aprobado == false ? (matricula.EsFinalizada ? "Reprobado" : "En Curso")
                       : matricula.EsFinalizada ? "Reprobado"
                       : "En Curso";

            materias.Add(new BoletinMateriaDTO
            {
                IdDetalleMalla = dm.IdDetalleMalla,
                NombreMateria = dm.IdDetalleMallaNavigation?.IdMateriaNavigation?.Detalle ?? string.Empty,
                IdPlantillaEvaluacion = idPlantillaEvaluacion,
                EstructuraNotas = raices
                    .Select(r => BuildNotaArbol(r, byPadre, notasByEstructura))
                    .ToList(),
                NotaFinal = dm.NotaFinal,
                Estado = estado
            });
        }

        return new BoletinAlumnoDTO
        {
            IdMatricula = matricula.IdMatricula,
            NombreAlumno = nombreAlumno,
            Paralelo = matricula.IdParaleloNavigation?.NombreParalelo ?? string.Empty,
            Materias = materias
        };
    }

    private static NotaArbolDTO BuildNotaArbol(
        PlantillaEstructura nodo,
        ILookup<int?, PlantillaEstructura> byPadre,
        IReadOnlyDictionary<int, NotasAlumno> notasByEstructura)
    {
        var hijos = byPadre[nodo.IdPlantillaEstructura].OrderBy(h => h.Orden).ToList();
        notasByEstructura.TryGetValue(nodo.IdPlantillaEstructura, out var nota);

        return new NotaArbolDTO
        {
            IdPlantillaEstructura = nodo.IdPlantillaEstructura,
            NombreComponente = nodo.NodoNombre,
            Peso = nodo.Peso,
            ValorNota = nota?.ValorNota,
            EsCalculada = hijos.Any(),
            Observacion = nota?.Observacion,
            Hijos = hijos
                .Select(h => BuildNotaArbol(h, byPadre, notasByEstructura))
                .ToList()
        };
    }

    public async Task<string> GetEstadoAprobacionAsync(
        int idPlantillaEstructura,
        int idDetalleMatricula,
        CancellationToken ct)
    {
        var nota = await _notasRepo.GetNotaByDetalleMatriculaAsync(idPlantillaEstructura, idDetalleMatricula, ct);
        if (nota?.ValorNota == null) return "Pendiente";

        var regla = await _reglasRepo.GetByPlantillaEstructuraAsync(idPlantillaEstructura, ct);
        if (regla == null) return "Sin regla";

        if (regla.NotaMinimaAprobar.HasValue && nota.ValorNota >= regla.NotaMinimaAprobar.Value)
            return "Aprobado";
        if (regla.NotaMinimaRecuperar.HasValue && nota.ValorNota >= regla.NotaMinimaRecuperar.Value)
            return "Recuperacion";

        if (regla.NotaMinimaAprobar.HasValue && nota.ValorNota < regla.NotaMinimaAprobar.Value)
             return "Reprobado";

        return "Pendiente";
    }

    private decimal CalcularPromedioPonderado(List<(decimal? nota, decimal peso)> notas)
    {
        var sumaPesos = notas.Sum(n => n.peso);
        if (sumaPesos == 0) return 0;
        return notas.Sum(n => n.nota!.Value * n.peso) / sumaPesos;
    }
}
