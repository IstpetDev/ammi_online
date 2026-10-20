namespace AMMI_Online_API.Application.DTOs.Postulations;

public class MatriculaDTO
{
    public int IdMatricula { get; set; }
    public int IdMalla { get; set; }
    public string DetalleMalla { get; set; }
    public int IdUsuarioAlumno { get; set; }
    public string DetalleParalelo { get; set; }
    public bool EsFinalizada { get; set; }
    public string DetalleTipoOferta { get; set; }
    public string PrimerNombre { get; set; }
    public string PrimerApellido { get; set; }
    public string SegundoNombre { get; set; }
    public string SegundoApellido { get; set; }
    public string NumeroDocumento { get; set; }
    public string DetalleCiclo { get; set; }
}