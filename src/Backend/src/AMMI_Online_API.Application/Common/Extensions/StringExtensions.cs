namespace AMMI_Online_API.Application.Common.Extensions;

public static class StringExtensions
{
    public static string IfEmpty(this string? valor, string? replaceValue = null)
    {
        return string.IsNullOrWhiteSpace(valor) ? replaceValue ?? string.Empty : valor;
    }
}
