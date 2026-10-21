namespace AMMI_Online_API.Domain.Interfaces;

/// <summary>
/// Permite coordinar una transacción de base de datos que abarca múltiples repositorios.
/// Todos los repositorios comparten el mismo DbContext (scoped), por lo que cada
/// SaveChangesAsync() individual participa en la transacción abierta y sólo se
/// persiste definitivamente cuando se llama a CommitAsync().
/// </summary>
public interface IUnitOfWork : IAsyncDisposable
{
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitAsync(CancellationToken cancellationToken = default);
    Task RollbackAsync(CancellationToken cancellationToken = default);
}
