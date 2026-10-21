using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Services;
using MediatR;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Queries;

namespace AMMI_Online_API.Application.Features.Segurity.Handlers;

/// <summary>
/// Handler para enviar código OTP
/// </summary>
public class SendOtpCommandHandler : IRequestHandler<SendOtpCommand, Response<OtpResponseDTO>>
{
    private readonly IOtpService _otpService;

    public SendOtpCommandHandler(IOtpService otpService)
    {
        _otpService = otpService;
    }

    public async Task<Response<OtpResponseDTO>> Handle(
        SendOtpCommand request, 
        CancellationToken cancellationToken)
    {
        return await _otpService.SendOtpEmailAsync(
            request.Email,
            request.NombrePostulante);
    }
}

/// <summary>
/// Handler para verificar código OTP
/// </summary>
public class VerifyOtpCommandHandler : IRequestHandler<VerifyOtpCommand, Response<VerifyOtpResponseDTO>>
{
    private readonly IOtpService _otpService;

    public VerifyOtpCommandHandler(IOtpService otpService)
    {
        _otpService = otpService;
    }

    public async Task<Response<VerifyOtpResponseDTO>> Handle(
        VerifyOtpCommand request, 
        CancellationToken cancellationToken)
    {
        return await _otpService.VerifyOtpAsync(
            request.Email, 
            request.Codigo);
    }
}

/// <summary>
/// Handler para verificar por token desde email (botón de verificación)
/// </summary>
public class VerifyOtpByTokenCommandHandler : IRequestHandler<VerifyOtpByTokenCommand, Response<VerifyOtpResponseDTO>>
{
    private readonly IOtpService _otpService;

    public VerifyOtpByTokenCommandHandler(IOtpService otpService)
    {
        _otpService = otpService;
    }

    public async Task<Response<VerifyOtpResponseDTO>> Handle(
        VerifyOtpByTokenCommand request, 
        CancellationToken cancellationToken)
    {
        return await _otpService.VerifyOtpByTokenAsync(request.Token);
    }
}

/// <summary>
/// Handler para reenviar código OTP
/// </summary>
public class ResendOtpCommandHandler : IRequestHandler<ResendOtpCommand, Response<OtpResponseDTO>>
{
    private readonly IOtpService _otpService;

    public ResendOtpCommandHandler(IOtpService otpService)
    {
        _otpService = otpService;
    }

    public async Task<Response<OtpResponseDTO>> Handle(
        ResendOtpCommand request, 
        CancellationToken cancellationToken)
    {
        return await _otpService.ResendOtpAsync(request.Email);
    }
}

public class CheckEmailVerifiedQueryHandler : IRequestHandler<CheckEmailVerifiedQuery, Response<bool>>
{
    private readonly IEmailVerificationOtpRepository _repository;

    public CheckEmailVerifiedQueryHandler(IEmailVerificationOtpRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(
        CheckEmailVerifiedQuery request, 
        CancellationToken cancellationToken)
    {
        // Utilizamos el método existente en IEmailVerificationOtpRepository
        bool isVerified = await _repository.IsEmailVerifiedAsync(request.Email);
        
        return new Response<bool> 
        { 
            Data = isVerified, 
            IsSuccess = true,
            Message = isVerified ? "El email está verificado." : "El email no está verificado."
        };
    }
}
