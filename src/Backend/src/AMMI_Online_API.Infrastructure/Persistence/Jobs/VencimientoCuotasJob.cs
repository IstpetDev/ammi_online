using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Infrastructure.Persistence.Jobs;

public class VencimientoCuotasJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<VencimientoCuotasJob> _logger;

    public VencimientoCuotasJob(IServiceProvider serviceProvider, ILogger<VencimientoCuotasJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Ejecutar poco después del inicio
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Iniciando proceso automático de revisión de vencimientos de cuotas...");

            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<Ammi_OnlineContext>();
                    var hoy = DateOnly.FromDateTime(DateTime.Today);

                    // Buscamos cuotas PENDIENTES o PARCIAL que ya pasaron su fecha límite
                    var cuotasAVencer = await context.DetalleCredito
                        .Where(dc => (dc.Estado == "PENDIENTE" || dc.Estado == "PARCIAL") 
                                     && dc.FechaLimite < hoy 
                                     && !dc.Pagado)
                        .ToListAsync(stoppingToken);

                    if (cuotasAVencer.Any())
                    {
                        foreach (var cuota in cuotasAVencer)
                        {
                            cuota.Estado = "VENCIDA";
                        }

                        // Al guardar, el AuditInterceptor se encargará del UpdatedAt
                        await context.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation("Proceso finalizado: {count} cuotas marcadas como VENCIDAS.", cuotasAVencer.Count);
                    }
                    else
                    {
                        _logger.LogInformation("No se encontraron cuotas para vencer en el día de hoy.");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ocurrió un error crítico durante el proceso de vencimiento de cuotas.");
            }

            // Ejecutar cada 12 horas para mayor seguridad
            await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
        }
    }
}
