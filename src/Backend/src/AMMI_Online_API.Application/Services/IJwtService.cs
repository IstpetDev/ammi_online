using System.Security.Claims;
using AMMI_Online_API.Application.DTOs.Segurity;

namespace AMMI_Online_API.Application.Services;

public interface IJwtService
{
    string GenerateToken(int idPersona, string username, IEnumerable<RolInfoDTO> roles, IEnumerable<PermisoDTO> permisos, bool requiereCambioContrasenia = false);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
    DateTime GetTokenExpiration();
}
