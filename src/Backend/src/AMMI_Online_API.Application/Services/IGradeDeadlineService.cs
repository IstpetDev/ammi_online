using System;

namespace AMMI_Online_API.Application.Services;

public enum GradePeriodStatus
{
    NotStarted,
    InProgress,
    GracePeriod,
    Closed
}

public interface IGradeDeadlineService
{
    GradePeriodStatus GetStatus(DateOnly? fechaInicio, DateOnly? fechaFin, int? diasGracia);
    GradePeriodStatus GetStatus(DateOnly? fechaFin, int? diasGracia);
    bool CanSubmitGrades(DateOnly? fechaInicio, DateOnly? fechaFin, int? diasGracia);
    bool CanSubmitGrades(DateOnly? fechaFin, int? diasGracia);
    int DaysUntilDeadline(DateOnly? fechaFin, int? diasGracia);
    int DaysIntoGracePeriod(DateOnly? fechaFin, int? diasGracia);
    string GetStatusMessage(DateOnly? fechaInicio, DateOnly? fechaFin, int? diasGracia);
    string GetStatusMessage(DateOnly? fechaFin, int? diasGracia);
}