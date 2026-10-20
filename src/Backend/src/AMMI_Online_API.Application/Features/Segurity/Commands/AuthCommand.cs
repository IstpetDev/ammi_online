using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Commands;

public record LoginCommand(LoginRequestDTO Request) : IRequest<Response<LoginResponseDTO>>;
public record RegisterCommand(RegisterRequestDTO Request) : IRequest<Response<int>>;
public record ChangePasswordCommand(int IdPersona, ChangePasswordDTO Request) : IRequest<Response<bool>>;
public record CambiarContraseniaFirstLoginCommand(int IdPersona, CambiarContraseniaFirstLoginDTO Request) : IRequest<Response<bool>>;
public record ForgotPasswordCommand(ForgotPasswordRequestDTO Request) : IRequest<Response<bool>>;
public record ResetPasswordCommand(ResetPasswordRequestDTO Request) : IRequest<Response<bool>>;
