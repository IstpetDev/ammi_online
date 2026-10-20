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
}
