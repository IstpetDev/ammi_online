namespace AMMI_Online_API.Application.DTOs.Postulations
{
    public class CreateMatriculaDTO
    {
        // Create UsuarioAlumno
        public int IdPersona { get; set; }
        public string Username { get; set; }
        public string Contrasenia { get; set; }
        // Create Matricula
        public int IdUsuarioAlumno { get; set; }
        public int IdCursos { get; set; }
        public int IdCiclo { get; set; }
        public int IdParalelo { get; set; }
        //Crear Credito 
        public CreditoItem[] Creditos { get; set; } = Array.Empty<CreditoItem>();
        //Crear DetalleCredito
        public DetalleCreditoItem[] DetalleCreditos { get; set; } = Array.Empty<DetalleCreditoItem>();
    }

    public class CreditoItem
    {
        public int IdEspecieCiclo { get; set; }
        public int Diferido { get; set; }
    }

    public class DetalleCreditoItem
    {
        public decimal? Valor { get; set; }
        public decimal? ValorCancelado { get; set; }
        public DateOnly? FechaLimite { get; set; }
        public bool Pagado { get; set; }
        public DateOnly? FechaPago { get; set; }
    }
}
