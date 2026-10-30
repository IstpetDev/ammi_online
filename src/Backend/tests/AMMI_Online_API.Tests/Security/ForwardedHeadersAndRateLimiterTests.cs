using System.Net;
using System.Threading.RateLimiting;
using AMMI_Online_API.API.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace AMMI_Online_API.Tests.Security;

public class ForwardedHeadersAndRateLimiterTests
{
    [Fact]
    public void ForwardedHeadersConfiguration_ConfiguraOpcionesDesdeConfiguration()
    {
        // Arrange
        var configData = new Dictionary<string, string?>
        {
            { "ForwardedHeaders:ForwardLimit", "2" },
            { "ForwardedHeaders:KnownProxies:0", "192.168.1.10" },
            { "ForwardedHeaders:KnownProxies:1", "10.0.0.1" },
            { "ForwardedHeaders:KnownNetworks:0", "172.16.0.0/16" }
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var services = new ServiceCollection();
        services.AddForwardedHeadersConfiguration(configuration);
        var provider = services.BuildServiceProvider();

        // Act
        var options = provider.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value;

        // Assert
        Assert.Equal(2, options.ForwardLimit);
        Assert.True(options.ForwardedHeaders.HasFlag(ForwardedHeaders.XForwardedFor));
        Assert.True(options.ForwardedHeaders.HasFlag(ForwardedHeaders.XForwardedProto));
        Assert.Contains(IPAddress.Parse("192.168.1.10"), options.KnownProxies);
        Assert.Contains(IPAddress.Parse("10.0.0.1"), options.KnownProxies);
        Assert.Contains(options.KnownNetworks, n => n.Prefix.ToString() == "172.16.0.0" && n.PrefixLength == 16);
    }

    [Fact]
    public async Task RateLimiterConfiguration_RegistraOpcionesYRejectionStatusCode429()
    {
        // Arrange
        var configData = new Dictionary<string, string?>
        {
            { "RateLimiting:AuthPolicy:PermitLimit", "15" },
            { "RateLimiting:OtpPolicy:PermitLimit", "8" },
            { "RateLimiting:CatalogPolicy:PermitLimit", "150" }
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddCustomRateLimiting(configuration);
        var provider = services.BuildServiceProvider();

        // Act
        var options = provider.GetRequiredService<IOptions<RateLimiterOptions>>().Value;

        // Assert
        Assert.Equal(StatusCodes.Status429TooManyRequests, options.RejectionStatusCode);
        Assert.NotNull(options.OnRejected);

        // Probar el manejador OnRejected
        var httpContext = new DefaultHttpContext();
        var responseStream = new MemoryStream();
        httpContext.Response.Body = responseStream;

        var onRejectedContext = new OnRejectedContext
        {
            HttpContext = httpContext,
            Lease = new FakeRateLimitLease()
        };

        await options.OnRejected(onRejectedContext, CancellationToken.None);

        Assert.Equal(StatusCodes.Status429TooManyRequests, httpContext.Response.StatusCode);
        responseStream.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(responseStream);
        var body = await reader.ReadToEndAsync();
        Assert.Contains("Demasiadas solicitudes", body);
    }

    private sealed class FakeRateLimitLease : RateLimitLease
    {
        public override bool IsAcquired => false;
        public override IEnumerable<string> MetadataNames => Enumerable.Empty<string>();
        public override bool TryGetMetadata(string metadataName, out object? metadata)
        {
            metadata = null;
            return false;
        }
    }
}
