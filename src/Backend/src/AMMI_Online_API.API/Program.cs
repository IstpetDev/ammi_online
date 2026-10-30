using AMMI_Online_API.API.Extensions;
using AMMI_Online_API.API.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.local.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>(optional: true);
}

builder.Services.AddControllers(options =>
{
    // Inserta proveedor de decimales al principio de la lista
    options.ModelBinderProviders.Insert(0, new InvariantDecimalModelBinderProvider());
});
builder.Services.AddEndpointsApiExplorer();

builder.Services
    .AddProjectServices(builder.Configuration)
    .AddForwardedHeadersConfiguration(builder.Configuration)
    .AddCustomRateLimiting(builder.Configuration)
    .AddJwtAuthentication(builder.Configuration)
    .AddSwaggerDocumentation()
    .AddCorsPolicies(builder.Configuration);

var app = builder.Build();

// Manejo de proxy inverso y determinación de IP real antes de rate limiting y autenticación
app.UseForwardedHeaders();

// Límite de tasa para protección contra abusos y fuerza bruta
app.UseRateLimiter();

app.UseProjectMiddleware();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsExtensions.PolicyName);
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
