using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Application.Services.Implementations;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace AMMI_Online_API.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<IPlantillaEstructuraService, PlantillaEstructuraService>();
        services.AddScoped<IInfraestructuraValidationService, InfraestructuraValidationService>();
        services.AddScoped<INotasCalculoService, NotasCalculoService>();
        services.AddScoped<IGradeDeadlineService, GradeDeadlineService>();
        services.AddScoped<IFileValidationService, FileValidationService>();
        return services;
    }
}
