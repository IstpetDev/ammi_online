using System.Net;
using Microsoft.AspNetCore.HttpOverrides;

namespace AMMI_Online_API.API.Extensions;

public static class ForwardedHeadersExtensions
{
    public static IServiceCollection AddForwardedHeadersConfiguration(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

            // Limitar el número de saltos para evitar spoofing (por defecto 1 en topología de proxy inverso)
            var forwardLimit = configuration.GetValue<int?>("ForwardedHeaders:ForwardLimit") ?? 1;
            options.ForwardLimit = forwardLimit;

            // Proxies de confianza configurados
            var knownProxies = configuration.GetSection("ForwardedHeaders:KnownProxies").Get<string[]>();
            if (knownProxies != null && knownProxies.Length > 0)
            {
                foreach (var proxy in knownProxies)
                {
                    if (IPAddress.TryParse(proxy.Trim(), out var parsedIp))
                    {
                        options.KnownProxies.Add(parsedIp);
                    }
                }
            }

            // Redes de proxies de confianza configuradas (CIDR)
            var knownNetworks = configuration.GetSection("ForwardedHeaders:KnownNetworks").Get<string[]>();
            if (knownNetworks != null && knownNetworks.Length > 0)
            {
                foreach (var network in knownNetworks)
                {
                    var parts = network.Split('/');
                    if (parts.Length == 2 &&
                        IPAddress.TryParse(parts[0].Trim(), out var prefix) &&
                        int.TryParse(parts[1].Trim(), out var prefixLength))
                    {
                        options.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(prefix, prefixLength));
                    }
                }
            }
        });

        return services;
    }
}
