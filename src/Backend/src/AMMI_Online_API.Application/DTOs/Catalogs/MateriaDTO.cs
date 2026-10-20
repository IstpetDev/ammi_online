namespace AMMI_Online_API.Application.DTOs.Catalogs
{
    public record MateriaDTO
    {
        public int IdMateria { get; set; }
        public string Detalle { get; set; }
        public decimal HorasRequeridas { get; set; }
        public DateOnly? FechaCreacion { get; set; }
        public bool EsActivo { get; set; }
    }

    public record MateriaCreateDTO
    {
        public string Detalle { get; set; }
        public decimal HorasRequeridas { get; set; }
        public DateOnly? FechaCreacion { get; set; }
        public bool EsActivo { get; set; }
    }

    public record MateriaUpdateDTO
    {
        public int IdMateria { get; set; }
        public string Detalle { get; set; }
        public decimal HorasRequeridas { get; set; }
        public DateOnly? FechaCreacion { get; set; }
        public bool EsActivo { get; set; }
    }
}
