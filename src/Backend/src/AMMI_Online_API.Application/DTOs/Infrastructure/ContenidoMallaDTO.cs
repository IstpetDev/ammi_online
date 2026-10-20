using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Application.DTOs.Infrastructure;

public record ContenidoMallaDTO
{
    public int IdContenidoMalla { get; set; }
    public int IdDetalleMalla { get; set; }
    public string Contenido { get; set; } = string.Empty;
    public DateOnly FechaRegistro { get; set; }
    public bool EsActivo { get; set; }

    // Datos relacionados
    public string NombreMateria { get; set; } = string.Empty;
}

public record ContenidoMallaCreateDTO
{
    public int IdDetalleMalla { get; set; }
    public IFormFile Contenido { get; set; }
}

public record ContenidoMallaUpdateDTO
{
    public int IdContenidoMalla { get; set; }
    public IFormFile Contenido { get; set; }
    public bool EsActivo { get; set; }
}


