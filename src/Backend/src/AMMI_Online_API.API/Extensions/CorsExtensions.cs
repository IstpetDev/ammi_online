namespace AMMI_Online_API.API.Extensions;

public static class CorsExtensions
{
    public const string PolicyName = "FrontendPolicy";

    private static readonly string[] DefaultOrigins =
    [
        "https://ammionline.ammi.edu.ec",
        "http://localhost:4200",
        "https://localhost:4200",
        "http://localhost",
        "https://localhost"
    ];

    public static IServiceCollection AddCorsPolicies(
        this IServiceCollection services,
        IConfiguration? configuration = null)
    {
        services.AddCors(options =>
        {
            options.AddPolicy(PolicyName, policy =>
            {
                var allowedOrigins = configuration != null
                    ? GetAllowedOrigins(configuration)
                    : Array.Empty<string>();

                var origins = allowedOrigins.Length > 0 ? allowedOrigins : DefaultOrigins;

                policy.WithOrigins(origins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials()
                      .WithExposedHeaders("Content-Disposition");
            });
        });

        return services;
    }

    public static string[] GetAllowedOrigins(IConfiguration configuration)
    {
        var list = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        if (list != null && list.Length > 0)
        {
            return list
                .Where(o => !string.IsNullOrWhiteSpace(o))
                .Select(o => o.Trim())
                .ToArray();
        }

        var single = configuration["Cors:AllowedOrigins"] ?? configuration["CorsSettings:AllowedOrigins"];
        if (!string.IsNullOrWhiteSpace(single))
        {
            return single
                .Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrEmpty(s))
                .ToArray();
        }

        return Array.Empty<string>();
    }
}
