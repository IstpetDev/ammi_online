namespace AMMI_Online_API.Application.Features.Catalogs.DTOs
{
    public record GeneroDTO
    {
        public int IdGenero { get; set; }
        public string Nombre { get; set; }
    }

    public record GeneroCreateDTO
    {
        public string Nombre { get; set; }
    }

    public record GeneroUpdateDTO
    {
        public int IdGenero { get; set; }
        public string Nombre { get; set; }
    }
}