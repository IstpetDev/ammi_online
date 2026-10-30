using AMMI_Online_API.Application.Common.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AMMI_Online_API.Application.Services.Implementations;

public class AuthSecurityService : IAuthSecurityService
{
    private readonly IMemoryCache _cache;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuthSecurityService> _logger;

    private readonly int _maxFailedAttempts;
    private readonly int _lockoutDurationMinutes;
    private readonly int _failedAttemptWindowMinutes;
    private readonly int _maxActionAttempts;
    private readonly int _actionWindowMinutes;

    public AuthSecurityService(
        IMemoryCache cache,
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration,
        ILogger<AuthSecurityService> logger)
    {
        _cache = cache;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;

        var section = configuration.GetSection(AuthSecurityOptions.SectionName);
        _maxFailedAttempts = section.GetValue<int?>("MaxFailedAttempts") ?? 5;
        _lockoutDurationMinutes = section.GetValue<int?>("LockoutDurationMinutes") ?? 15;
        _failedAttemptWindowMinutes = section.GetValue<int?>("FailedAttemptWindowMinutes") ?? 15;
        _maxActionAttempts = section.GetValue<int?>("MaxActionAttempts") ?? 5;
        _actionWindowMinutes = section.GetValue<int?>("ActionWindowMinutes") ?? 15;
    }

    public string GetCurrentClientIp()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null)
            return "127.0.0.1";

        var remoteIp = context.Connection.RemoteIpAddress?.ToString();
        if (string.IsNullOrWhiteSpace(remoteIp))
            return "127.0.0.1";

        if (remoteIp == "::1")
            return "127.0.0.1";

        return remoteIp;
    }

    public bool IsLoginLockedOut(string accountIdentifier, string? clientIp = null)
    {
        if (IsAccountLockedOut(accountIdentifier))
            return true;

        var ip = ResolveIp(clientIp);
        return IsIpLockedOut(ip);
    }

    public bool IsAccountLockedOut(string accountIdentifier)
    {
        if (string.IsNullOrWhiteSpace(accountIdentifier))
            return false;

        var key = BuildAccountLockoutKey(accountIdentifier);
        return _cache.TryGetValue(key, out _);
    }

    public bool IsIpLockedOut(string ipAddress)
    {
        if (string.IsNullOrWhiteSpace(ipAddress))
            return false;

        var key = BuildIpLockoutKey(ipAddress);
        return _cache.TryGetValue(key, out _);
    }

    public bool IsActionLockedOut(string actionKey, string accountIdentifier, string? clientIp = null)
    {
        var ip = ResolveIp(clientIp);

        if (!string.IsNullOrWhiteSpace(accountIdentifier))
        {
            var accKey = BuildActionLockoutKey(actionKey, "acc", accountIdentifier);
            if (_cache.TryGetValue(accKey, out _))
                return true;
        }

        if (!string.IsNullOrWhiteSpace(ip))
        {
            var ipKey = BuildActionLockoutKey(actionKey, "ip", ip);
            if (_cache.TryGetValue(ipKey, out _))
                return true;
        }

        return false;
    }

    public bool RecordFailedAttempt(string accountIdentifier, string? clientIp = null)
    {
        var ip = ResolveIp(clientIp);
        bool accountLocked = false;
        bool ipLocked = false;

        if (!string.IsNullOrWhiteSpace(accountIdentifier))
        {
            var accAttempts = _cache.GetOrCreate(BuildAccountAttemptsKey(accountIdentifier), entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_failedAttemptWindowMinutes);
                return new AttemptCounter();
            })!;

            var count = accAttempts.Increment();
            if (count >= _maxFailedAttempts)
            {
                _cache.Set(
                    BuildAccountLockoutKey(accountIdentifier),
                    DateTime.UtcNow.AddMinutes(_lockoutDurationMinutes),
                    TimeSpan.FromMinutes(_lockoutDurationMinutes));
                accountLocked = true;
                _logger.LogWarning(
                    "Bloqueo temporal activado por superar {MaxAttempts} intentos fallidos para la cuenta: '{Account}'.",
                    _maxFailedAttempts,
                    accountIdentifier);
            }
        }

        if (!string.IsNullOrWhiteSpace(ip))
        {
            var ipAttempts = _cache.GetOrCreate(BuildIpAttemptsKey(ip), entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_failedAttemptWindowMinutes);
                return new AttemptCounter();
            })!;

            var count = ipAttempts.Increment();
            if (count >= _maxFailedAttempts)
            {
                _cache.Set(
                    BuildIpLockoutKey(ip),
                    DateTime.UtcNow.AddMinutes(_lockoutDurationMinutes),
                    TimeSpan.FromMinutes(_lockoutDurationMinutes));
                ipLocked = true;
                _logger.LogWarning(
                    "Bloqueo temporal activado por superar {MaxAttempts} intentos fallidos para la IP: '{IpAddress}'.",
                    _maxFailedAttempts,
                    ip);
            }
        }

        return accountLocked || ipLocked;
    }

    public bool RecordActionAttempt(string actionKey, string accountIdentifier, string? clientIp = null)
    {
        var ip = ResolveIp(clientIp);
        bool locked = false;

        if (!string.IsNullOrWhiteSpace(accountIdentifier))
        {
            var accAttempts = _cache.GetOrCreate(BuildActionAttemptsKey(actionKey, "acc", accountIdentifier), entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_actionWindowMinutes);
                return new AttemptCounter();
            })!;

            if (accAttempts.Increment() >= _maxActionAttempts)
            {
                _cache.Set(
                    BuildActionLockoutKey(actionKey, "acc", accountIdentifier),
                    DateTime.UtcNow.AddMinutes(_actionWindowMinutes),
                    TimeSpan.FromMinutes(_actionWindowMinutes));
                locked = true;
                _logger.LogWarning(
                    "Límite de acción '{Action}' superado para la cuenta '{Account}'. Bloqueo temporal activado.",
                    actionKey,
                    accountIdentifier);
            }
        }

        if (!string.IsNullOrWhiteSpace(ip))
        {
            var ipAttempts = _cache.GetOrCreate(BuildActionAttemptsKey(actionKey, "ip", ip), entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_actionWindowMinutes);
                return new AttemptCounter();
            })!;

            if (ipAttempts.Increment() >= _maxActionAttempts)
            {
                _cache.Set(
                    BuildActionLockoutKey(actionKey, "ip", ip),
                    DateTime.UtcNow.AddMinutes(_actionWindowMinutes),
                    TimeSpan.FromMinutes(_actionWindowMinutes));
                locked = true;
                _logger.LogWarning(
                    "Límite de acción '{Action}' superado para la IP '{IpAddress}'. Bloqueo temporal activado.",
                    actionKey,
                    ip);
            }
        }

        return locked;
    }

    public void ResetFailedAttempts(string accountIdentifier, string? clientIp = null)
    {
        if (!string.IsNullOrWhiteSpace(accountIdentifier))
        {
            _cache.Remove(BuildAccountLockoutKey(accountIdentifier));
            _cache.Remove(BuildAccountAttemptsKey(accountIdentifier));
        }

        var ip = ResolveIp(clientIp);
        if (!string.IsNullOrWhiteSpace(ip))
        {
            _cache.Remove(BuildIpLockoutKey(ip));
            _cache.Remove(BuildIpAttemptsKey(ip));
        }
    }

    public string GetInvalidCredentialsMessage() => "Usuario o contraseña incorrectos";

    public string GetLockoutMessage() =>
        "Demasiados intentos fallidos. Su acceso ha sido bloqueado temporalmente por motivos de seguridad. Por favor, intente más tarde.";

    private string ResolveIp(string? ip)
    {
        return !string.IsNullOrWhiteSpace(ip) ? ip : GetCurrentClientIp();
    }

    private static string Normalize(string val) => val.Trim().ToLowerInvariant();

    private static string BuildAccountLockoutKey(string account) => $"auth:lockout:acc:{Normalize(account)}";
    private static string BuildAccountAttemptsKey(string account) => $"auth:attempts:acc:{Normalize(account)}";
    private static string BuildIpLockoutKey(string ip) => $"auth:lockout:ip:{Normalize(ip)}";
    private static string BuildIpAttemptsKey(string ip) => $"auth:attempts:ip:{Normalize(ip)}";

    private static string BuildActionLockoutKey(string action, string scope, string val) =>
        $"auth:action:lockout:{action}:{scope}:{Normalize(val)}";
    private static string BuildActionAttemptsKey(string action, string scope, string val) =>
        $"auth:action:attempts:{action}:{scope}:{Normalize(val)}";

    private sealed class AttemptCounter
    {
        private int _count;
        public int Increment() => Interlocked.Increment(ref _count);
        public int Count => _count;
    }
}
