namespace AMMI_Online_API.API.Extensions;
public static class CorsExtensions
{
    public static IServiceCollection AddCorsPolicies(
        this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AngularDev", policy =>
            {
                policy.WithOrigins("http://localhost:4200", "http://localhost", "https://localhost", "https://ammionline.ammi.edu.ec")
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials()
                      .WithExposedHeaders("Content-Disposition");
            });
        });

        return services;
    }
}
