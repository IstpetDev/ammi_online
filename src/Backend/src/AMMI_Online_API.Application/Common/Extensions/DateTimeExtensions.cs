namespace AMMI_Online_API.Application.Common.Extensions;

public static class DateTimeExtensions
{

    public static DateTime Less(this DateTime valor1, DateTime valor2) => valor1 < valor2 ? valor1 : valor2;

    public static DateTime MenorIgual(this DateTime valor1, DateTime valor2) => valor1 <= valor2 ? valor1 : valor2;

    public static DateTime Greater(this DateTime valor1, DateTime valor2) => valor1 > valor2 ? valor1 : valor2;

    public static DateTime GreaterOrEqual(this DateTime valor1, DateTime valor2) => valor1 >= valor2 ? valor1 : valor2;

    public static bool Between(this DateTime valor, DateTime inicio, DateTime fin) => (valor >= inicio.Less(fin)) && (valor <= fin.Greater(inicio));

    public static int EdadMeses(this DateTime fechaNacimiento)
    {
        DateTime fechaActual = DateTime.Now.Date;
        int resultadoAnio = fechaActual.Year - fechaNacimiento.Year;

        int resultadoMeses;
        if (fechaNacimiento.Month > fechaActual.Month)
        {
            resultadoAnio--;
            resultadoMeses = fechaActual.Month + 12 - fechaNacimiento.Month;
        }
        else
        {
            resultadoMeses = fechaActual.Month - fechaNacimiento.Month;
        }

        int resultadoDias;
        if (fechaNacimiento.Day > fechaActual.Day)
        {
            resultadoAnio--;
            resultadoDias = fechaActual.Day + 12 - fechaNacimiento.Day;
        }
        else
        {
            resultadoDias = fechaActual.Day - fechaNacimiento.Day;
        }


        return (resultadoAnio * 12) + resultadoMeses + (resultadoDias / 30);

    }

    public static string EdadString(this DateTime fechaNacimiento)
    {
        DateTime fechaActual = DateTime.Now.Date;
        int resultadoAnio = fechaActual.Year - fechaNacimiento.Year;

        int resultadoMeses;
        if (fechaNacimiento.Month > fechaActual.Month)
        {
            resultadoAnio--;
            resultadoMeses = fechaActual.Month + 12 - fechaNacimiento.Month;
        }
        else
        {
            resultadoMeses = fechaActual.Month - fechaNacimiento.Month;
        }

        int resultadoDias;
        if (fechaNacimiento.Day > fechaActual.Day)
        {
            resultadoAnio--;
            resultadoDias = fechaActual.Day + 12 - fechaNacimiento.Day;
        }
        else
        {
            resultadoDias = fechaActual.Day - fechaNacimiento.Day;
        }


        return $"{resultadoAnio} años, {resultadoMeses} meses, {resultadoDias} dias";

    }
}
