using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Infrastructure.Persistence.Interceptors;

public class AuditInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void UpdateEntities(DbContext context)
    {
        if (context == null) return;

        var entries = context.ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        var utcNow = DateTime.UtcNow;

        foreach (var entry in entries)
        {
            // Buscamos propiedades por convención de nombre
            var createdAtProp = entry.Metadata.FindProperty("CreatedAt");
            var updatedAtProp = entry.Metadata.FindProperty("UpdatedAt");

            if (entry.State == EntityState.Added && createdAtProp != null)
            {
                entry.Property("CreatedAt").CurrentValue = utcNow;
            }

            if (updatedAtProp != null)
            {
                entry.Property("UpdatedAt").CurrentValue = utcNow;
            }
        }
    }
}
