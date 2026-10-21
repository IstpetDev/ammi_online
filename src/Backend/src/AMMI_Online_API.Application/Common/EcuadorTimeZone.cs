using System;

namespace AMMI_Online_API.Application.Common;

public static class EcuadorTimeZone
{
    private static readonly TimeZoneInfo _tz;

    static EcuadorTimeZone()
    {
        try { _tz = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"); }
        catch { _tz = TimeZoneInfo.FindSystemTimeZoneById("America/Guayaquil"); }
    }

    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _tz);
    public static DateOnly Today => DateOnly.FromDateTime(Now);
}