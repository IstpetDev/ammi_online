using AMMI_Online_API.API.Middleware;

namespace AMMI_Online_API.API.Extensions;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseProjectMiddleware(
        this IApplicationBuilder app)
    {
        app.UseMiddleware<GlobalExceptionMiddleware>();
        return app;
    }
}

