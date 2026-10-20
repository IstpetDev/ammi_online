using AMMI_Online_API.Application;
using AMMI_Online_API.Infrastructure;

namespace AMMI_Online_API.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddProjectServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddApplication();
        services.AddInfrastructure(configuration);
        services.AddHttpContextAccessor();
        services.AddMemoryCache();
        return services;
    }
}
