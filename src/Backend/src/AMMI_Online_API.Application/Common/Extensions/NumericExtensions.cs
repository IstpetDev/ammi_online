namespace AMMI_Online_API.Application.Common.Extensions;

public static class NumericExtensions
{
    public static byte Less(this byte valor1, byte valor2) => valor1 < valor2 ? valor1 : valor2;
    public static short Less(this short valor1, short valor2) => valor1 < valor2 ? valor1 : valor2;
    public static int Less(this int valor1, int valor2) => valor1 < valor2 ? valor1 : valor2;
    public static long Less(this long valor1, long valor2) => valor1 < valor2 ? valor1 : valor2;
    public static decimal Less(this decimal valor1, decimal valor2) => valor1 < valor2 ? valor1 : valor2;
    public static double Less(this double valor1, double valor2) => valor1 < valor2 ? valor1 : valor2;
    public static float Less(this float valor1, float valor2) => valor1 < valor2 ? valor1 : valor2;

    public static byte LessOrEqual(this byte valor1, byte valor2) => valor1 <= valor2 ? valor1 : valor2;
    public static short MenorIgual(this short valor1, short valor2) => valor1 <= valor2 ? valor1 : valor2;
    public static int MenorIgual(this int valor1, int valor2) => valor1 <= valor2 ? valor1 : valor2;
    public static long MenorIgual(this long valor1, long valor2) => valor1 <= valor2 ? valor1 : valor2;
    public static decimal MenorIgual(this decimal valor1, decimal valor2) => valor1 <= valor2 ? valor1 : valor2;
    public static double MenorIgual(this double valor1, double valor2) => valor1 <= valor2 ? valor1 : valor2;
    public static float MenorIgual(this float valor1, float valor2) => valor1 <= valor2 ? valor1 : valor2;


    public static byte Greater(this byte valor1, byte valor2) => valor1 > valor2 ? valor1 : valor2;
    public static short Greater(this short valor1, short valor2) => valor1 > valor2 ? valor1 : valor2;
    public static int Greater(this int valor1, int valor2) => valor1 > valor2 ? valor1 : valor2;
    public static long Greater(this long valor1, long valor2) => valor1 > valor2 ? valor1 : valor2;
    public static decimal Greater(this decimal valor1, decimal valor2) => valor1 > valor2 ? valor1 : valor2;
    public static double Greater(this double valor1, double valor2) => valor1 > valor2 ? valor1 : valor2;
    public static float Greater(this float valor1, float valor2) => valor1 > valor2 ? valor1 : valor2;

    public static byte GreaterOrEqual(this byte valor1, byte valor2) => valor1 >= valor2 ? valor1 : valor2;
    public static short GreaterOrEqual(this short valor1, short valor2) => valor1 >= valor2 ? valor1 : valor2;
    public static int GreaterOrEqual(this int valor1, int valor2) => valor1 >= valor2 ? valor1 : valor2;
    public static long GreaterOrEqual(this long valor1, long valor2) => valor1 >= valor2 ? valor1 : valor2;
    public static decimal GreaterOrEqual(this decimal valor1, decimal valor2) => valor1 >= valor2 ? valor1 : valor2;
    public static double GreaterOrEqual(this double valor1, double valor2) => valor1 >= valor2 ? valor1 : valor2;
    public static float GreaterOrEqual(this float valor1, float valor2) => valor1 >= valor2 ? valor1 : valor2;


    public static bool Between(this byte valor, byte inicio, byte fin) => (valor >= inicio.Less(fin)) && (valor <= fin.Greater(inicio));
    public static bool Between(this short valor, short inicio, short fin) => (valor >= inicio.Less(fin)) && (valor <= fin.Greater(inicio));
    public static bool Between(this int valor, int inicio, int fin) => (valor >= inicio.Less(fin)) && (valor <= fin.Greater(inicio));
    public static bool Between(this long valor, long inicio, long fin) => (valor >= inicio.Less(fin)) && (valor <= fin.Greater(inicio));
    public static bool Between(this decimal valor, decimal inicio, decimal fin) => (valor >= inicio.Less(fin)) && (valor <= fin.Greater(inicio));
    public static bool Between(this double valor, double inicio, double fin) => (valor >= inicio.Less(fin)) && (valor <= fin.Greater(inicio));
    public static bool Between(this float valor, float inicio, float fin) => (valor >= inicio.Less(fin)) && (valor <= fin.Greater(inicio));

    public static byte Min(this byte valor, byte valorComparacion) => valor > valorComparacion ? valorComparacion : valor;
    public static short Min(this short valor, short valorComparacion) => valor > valorComparacion ? valorComparacion : valor;
    public static int Min(this int valor, int valorComparacion) => valor > valorComparacion ? valorComparacion : valor;
    public static long Min(this long valor, long valorComparacion) => valor > valorComparacion ? valorComparacion : valor;
    public static decimal Min(this decimal valor, decimal valorComparacion) => valor > valorComparacion ? valorComparacion : valor;
    public static double Min(this double valor, double valorComparacion) => valor > valorComparacion ? valorComparacion : valor;
    public static float Min(this float valor, float valorComparacion) => valor > valorComparacion ? valorComparacion : valor;

    public static byte Max(this byte valor, byte valorComparacion) => valor < valorComparacion ? valorComparacion : valor;
    public static short Max(this short valor, short valorComparacion) => valor < valorComparacion ? valorComparacion : valor;
    public static int Max(this int valor, int valorComparacion) => valor < valorComparacion ? valorComparacion : valor;
    public static long Max(this long valor, long valorComparacion) => valor < valorComparacion ? valorComparacion : valor;
    public static decimal Max(this decimal valor, decimal valorComparacion) => valor < valorComparacion ? valorComparacion : valor;
    public static double Max(this double valor, double valorComparacion) => valor < valorComparacion ? valorComparacion : valor;
    public static float Max(this float valor, float valorComparacion) => valor < valorComparacion ? valorComparacion : valor;

}
