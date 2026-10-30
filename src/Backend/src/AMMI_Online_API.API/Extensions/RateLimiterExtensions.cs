using System.Threading.RateLimiting;
using AMMI_Online_API.Application.Common.Wrapper;
using Microsoft.AspNetCore.RateLimiting;

namespace AMMI_Online_API.API.Extensions;

public static class RateLimiterExtensions
{
    public const string AuthPolicy = "auth-policy";
    public const string OtpPolicy = "otp-policy";
    public const string CatalogPolicy = "catalog-policy";

    public static IServiceCollection AddCustomRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.ContentType = "application/json";

                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                }

                var response = Response<object>.Failure("Demasiadas solicitudes. Por favor, espere antes de intentar nuevamente.");
                await context.HttpContext.Response.WriteAsJsonAsync(response, cancellationToken);
            };

            // 1. Política para endpoints de autenticación y credenciales (login, register, forgot-password, reset-password)
            options.AddPolicy(AuthPolicy, httpContext =>
            {
                var clientIp = ResolveClientIp(httpContext);
                var permitLimit = configuration.GetValue<int?>("RateLimiting:AuthPolicy:PermitLimit") ?? 10;
                var windowMinutes = configuration.GetValue<int?>("RateLimiting:AuthPolicy:WindowMinutes") ?? 1;

                return RateLimitPartition.GetSlidingWindowLimiter(
                    clientIp,
                    _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = permitLimit,
                        Window = TimeSpan.FromMinutes(windowMinutes),
                        SegmentsPerWindow = 2,
                        QueueLimit = 0
                    });
            });

            // 2. Política para endpoints de verificación de correo y códigos OTP
            options.AddPolicy(OtpPolicy, httpContext =>
            {
                var clientIp = ResolveClientIp(httpContext);
                var permitLimit = configuration.GetValue<int?>("RateLimiting:OtpPolicy:PermitLimit") ?? 5;
                var windowMinutes = configuration.GetValue<int?>("RateLimiting:OtpPolicy:WindowMinutes") ?? 1;

                return RateLimitPartition.GetSlidingWindowLimiter(
                    clientIp,
                    _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = permitLimit,
                        Window = TimeSpan.FromMinutes(windowMinutes),
                        SegmentsPerWindow = 2,
                        QueueLimit = 0
                    });
            });

            // 3. Política para catálogos públicos y consultas masivas (120 req/min por IP)
            options.AddPolicy(CatalogPolicy, httpContext =>
            {
                var clientIp = ResolveClientIp(httpContext);
                var permitLimit = configuration.GetValue<int?>("RateLimiting:CatalogPolicy:PermitLimit") ?? 120;
                var windowMinutes = configuration.GetValue<int?>("RateLimiting:CatalogPolicy:WindowMinutes") ?? 1;

                return RateLimitPartition.GetSlidingWindowLimiter(
                    clientIp,
                    _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = permitLimit,
                        Window = TimeSpan.FromMinutes(windowMinutes),
                        SegmentsPerWindow = 3,
                        QueueLimit = 0
                    });
            });
        });

        return services;
    }

    private static string ResolveClientIp(HttpContext httpContext)
    {
        var remoteIp = httpContext.Connection.RemoteIpAddress?.ToString();
        if (string.IsNullOrWhiteSpace(remoteIp) || remoteIp == "::1")
        {
            return "127.0.0.1";
        }
        return remoteIp;
    }
}
