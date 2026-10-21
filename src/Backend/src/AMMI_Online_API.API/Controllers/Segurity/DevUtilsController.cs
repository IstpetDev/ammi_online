using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Segurity;

[ApiController]
[Route("api/[controller]")]
[Authorize]

public class DevUtilsController : ControllerBase
{
    private readonly IPasswordHasher _passwordHasher;
    private readonly IWebHostEnvironment _environment;

    public DevUtilsController(
        IPasswordHasher passwordHasher,
        IWebHostEnvironment environment)
    {
        _passwordHasher = passwordHasher;
        _environment = environment;
    }

    [HttpPost("hash-password")]
    
    public ActionResult<Response<HashPasswordResponseDTO>> HashPassword(
        [FromBody] HashPasswordRequestDTO request)
    {
        if (!_environment.IsDevelopment())
            return StatusCode(403, Response<HashPasswordResponseDTO>.Failure(
                "Este endpoint solo está disponible en ambiente de desarrollo"));

        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(Response<HashPasswordResponseDTO>.Failure(
                "La contraseña no puede estar vacía"));

        var hashedPassword = _passwordHasher.HashPassword(request.Password);

        var response = new HashPasswordResponseDTO
        {
            OriginalPassword = request.Password,
            HashedPassword = hashedPassword,
            Algorithm = "BCrypt",
            WorkFactor = 12,
            GeneratedAt = DateTime.UtcNow
        };

        return Ok(Response<HashPasswordResponseDTO>.Success(
            response,
            "Hash generado correctamente. Use este valor para insertar en la base de datos."));
    }

    [HttpPost("verify-password")]
    
    public ActionResult<Response<VerifyPasswordResponseDTO>> VerifyPassword(
        [FromBody] VerifyPasswordRequestDTO request)
    {
        if (!_environment.IsDevelopment())
            return StatusCode(403, Response<VerifyPasswordResponseDTO>.Failure(
                "Este endpoint solo está disponible en ambiente de desarrollo"));

        if (string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.HashedPassword))
            return BadRequest(Response<VerifyPasswordResponseDTO>.Failure(
                "Debe proporcionar la contraseña y el hash"));

        var isMatch = _passwordHasher.VerifyPassword(request.Password, request.HashedPassword);

        var response = new VerifyPasswordResponseDTO
        {
            IsMatch = isMatch,
            Message = isMatch
                ? "La contraseña COINCIDE con el hash"
                : "La contraseña NO coincide con el hash",
            PasswordProvided = request.Password,
            HashProvided = request.HashedPassword
        };

        return Ok(Response<VerifyPasswordResponseDTO>.Success(
            response,
            isMatch ? "Verificación exitosa" : "Verificación fallida"));
    }
}
