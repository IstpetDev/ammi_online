using AMMI_Online_API.Domain.Interfaces;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore.Storage;

namespace AMMI_Online_API.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly Ammi_OnlineContext _context;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null)
            throw new InvalidOperationException("No hay una transacción activa. Llame BeginTransactionAsync primero.");

        await _transaction.CommitAsync(cancellationToken);
    }

    public async Task RollbackAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is not null)
            await _transaction.RollbackAsync(cancellationToken);
    }

    public async ValueTask DisposeAsync()
    {
        if (_transaction is not null)
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }
}
