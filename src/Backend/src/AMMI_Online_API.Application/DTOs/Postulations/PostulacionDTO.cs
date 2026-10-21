using System;

namespace AMMI_Online_API.Application.DTOs.Postulations;

public class PostulacionDTO
{
    public int IdPostulacion { get; set; }
    
    // Persona
    public string PrimerNombre { get; set; }
    public string SegundoNombre { get; set; }
    public string PrimerApellido { get; set; }
    public string SegundoApellido { get; set; }
    public string Documento { get; set; }
    
    // PersonaInfo
    public DateOnly? FechaNacimiento { get; set; }
    
    // Malla
    public string MallaDetalle { get; set; }
    
    // Curso
    public string CursoDetalle { get; set; }
    
    // TipoOferta
    public string TipoOfertaDetalle { get; set; }
    
    // Estado
    public string EstadoDetalle { get; set; }
    
    // Ciclo Activo
    public string CicloActivoDetalle { get; set; }

    // Indica si existe algún requisito entregado pero aún sin aprobar ni rechazar
    public bool TieneRequisitosPendientes { get; set; }

    // Detalle cualitativo y conteos de requisitos
    public string EstadoRequisitos { get; set; }
    public int TotalRequisitosObligatorios { get; set; }
    public int TotalSubidosSinRevisar { get; set; }
    public int TotalSubidosAprobados { get; set; }
    public int TotalSubidosRechazados { get; set; }
    public int TotalRequisitosPendientes { get; set; }
    public List<string> RequisitosPendientesNombres { get; set; } = new();
    public string? ObservacionesRevision { get; set; }

    // Estado financiero de matrícula
    public bool MatriculaPagada { get; set; }
    public bool TieneMatriculaGenerada { get; set; }
    public string EstadoPagoMatricula { get; set; } = "SIN_PAGO"; // "PAGADO", "PAGO_POR_VALIDAR", "VALOR_FALTANTE", "SIN_PAGO"
    public decimal MontoTotalMatricula { get; set; }
    public decimal SaldoPendienteMatricula { get; set; }
    public decimal MontoPagadoMatricula { get; set; }
}
