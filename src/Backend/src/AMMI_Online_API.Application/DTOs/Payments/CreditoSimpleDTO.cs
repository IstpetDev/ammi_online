namespace AMMI_Online_API.Application.DTOs.Payments
{
    public class CreditoSimpleDTO
    {
        public int IdCredito { get; set; }
        public int IdMatricula { get; set; }
        public int IdEspecieCiclo { get; set; }

        // Campos de Credito
        public decimal MontoOriginal { get; set; }
        public decimal? MontoFinal { get; set; }
        public decimal SaldoPendiente { get; set; }
        public string Estado { get; set; } = string.Empty;

        // Datos de EspecieCiclo y Especie
        public decimal ValorEspecie { get; set; }
        public int IdEspecie { get; set; }
        public string DetalleEspecie { get; set; } = string.Empty;
        public bool EsDiferible { get; set; }
    }
}
