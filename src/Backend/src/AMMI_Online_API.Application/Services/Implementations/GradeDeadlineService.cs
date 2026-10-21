using AMMI_Online_API.Application.Common;

namespace AMMI_Online_API.Application.Services.Implementations;

public class GradeDeadlineService : IGradeDeadlineService
{
    private int GetGraceDays(int? diasGracia) => diasGracia ?? 5;

    public GradePeriodStatus GetStatus(DateOnly? fechaInicio, DateOnly? fechaFin, int? diasGracia)
    {
        var today = EcuadorTimeZone.Today;

        if (fechaInicio.HasValue && today < fechaInicio.Value)
            return GradePeriodStatus.NotStarted;

        if (fechaFin == null) return GradePeriodStatus.InProgress;

        var grace = GetGraceDays(diasGracia);

        if (today < fechaFin.Value) return GradePeriodStatus.InProgress;
        if (today <= fechaFin.Value.AddDays(grace)) return GradePeriodStatus.GracePeriod;
        return GradePeriodStatus.Closed;
    }

    public GradePeriodStatus GetStatus(DateOnly? fechaFin, int? diasGracia)
    {
        return GetStatus(null, fechaFin, diasGracia);
    }

    public bool CanSubmitGrades(DateOnly? fechaInicio, DateOnly? fechaFin, int? diasGracia)
    {
        var status = GetStatus(fechaInicio, fechaFin, diasGracia);
        return status == GradePeriodStatus.InProgress || status == GradePeriodStatus.GracePeriod;
    }

    public bool CanSubmitGrades(DateOnly? fechaFin, int? diasGracia)
    {
        return CanSubmitGrades(null, fechaFin, diasGracia);
    }

    public int DaysUntilDeadline(DateOnly? fechaFin, int? diasGracia)
    {
        if (fechaFin == null) return int.MaxValue;
        var grace = GetGraceDays(diasGracia);
        var deadline = fechaFin.Value.AddDays(grace);
        return deadline.DayNumber - EcuadorTimeZone.Today.DayNumber;
    }

    public int DaysIntoGracePeriod(DateOnly? fechaFin, int? diasGracia)
    {
        if (fechaFin == null) return 0;
        var today = EcuadorTimeZone.Today;
        if (today < fechaFin) return 0;
        return today.DayNumber - fechaFin.Value.DayNumber;
    }

    public string GetStatusMessage(DateOnly? fechaInicio, DateOnly? fechaFin, int? diasGracia)
    {
        var status = GetStatus(fechaInicio, fechaFin, diasGracia);
        var grace = GetGraceDays(diasGracia);

        return status switch
        {
            GradePeriodStatus.NotStarted => fechaInicio.HasValue
                ? $"El período de calificaciones aún no ha iniciado (Abre el {fechaInicio.Value:dd/MM/yyyy})."
                : "El período de calificaciones aún no ha iniciado.",
            GradePeriodStatus.InProgress => fechaFin.HasValue
                ? $"Período de calificaciones abierto hasta el {fechaFin.Value:dd/MM/yyyy}."
                : "Período de calificaciones abierto.",
            GradePeriodStatus.GracePeriod => $"⚠️ Prórroga: tienes {DaysUntilDeadline(fechaFin, diasGracia)} día(s) para subir notas. Vence el {fechaFin?.AddDays(grace):dd/MM/yyyy}.",
            GradePeriodStatus.Closed => "🔒 Plazo de calificaciones vencido.",
            _ => ""
        };
    }

    public string GetStatusMessage(DateOnly? fechaFin, int? diasGracia)
    {
        return GetStatusMessage(null, fechaFin, diasGracia);
    }
}