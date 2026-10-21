using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Segurity;

public class EmailVerificationOtpRepository : IEmailVerificationOtpRepository
{
    private readonly Ammi_OnlineContext _context;

    public EmailVerificationOtpRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<EmailVerificacionesOtp?> GetActiveOtpAsync(string email)
    {
        var now = DateTime.UtcNow;
        
        return await _context.EmailVerificacionesOtp
            .AsNoTracking()
            .Where(o => o.Email == email 
                && o.EsVerificado == 0ul 
                && o.FechaExpiracion > now
                && o.IntentosRestantes > 0)
            .OrderByDescending(o => o.FechaCreacion)
            .FirstOrDefaultAsync();
    }

    public async Task<EmailVerificacionesOtp> CreateOtpAsync(EmailVerificacionesOtp otp)
    {
        // La tabla tiene UNIQUE en email, hacemos UPSERT:
        // Si ya existe un registro con ese email, actualizamos; si no, insertamos.
        var existing = await _context.EmailVerificacionesOtp
            .FirstOrDefaultAsync(o => o.Email == otp.Email);

        if (existing != null)
        {
            existing.CodigoOtp = otp.CodigoOtp;
            existing.FechaCreacion = otp.FechaCreacion;
            existing.FechaExpiracion = otp.FechaExpiracion;
            existing.IntentosRestantes = otp.IntentosRestantes;
            existing.EsVerificado = otp.EsVerificado;
            existing.FechaVerificacion = null;
            existing.ReenviosRealizados = otp.ReenviosRealizados;
            existing.UltimoReenvio = otp.UltimoReenvio;
            existing.IpOrigen = otp.IpOrigen;

            otp.IdVerificacion = existing.IdVerificacion; // propagar el ID al objeto retornado
        }
        else
        {
            _context.EmailVerificacionesOtp.Add(otp);
        }

        await _context.SaveChangesAsync();
        return existing ?? otp;
    }

    public async Task<bool> VerifyOtpAsync(string email, string codigo)
    {
        var now = DateTime.UtcNow;
        
        var otp = await _context.EmailVerificacionesOtp
            .Where(o => o.Email == email 
                && o.CodigoOtp == codigo
                && o.EsVerificado == 0ul 
                && o.FechaExpiracion > now
                && o.IntentosRestantes > 0)
            .OrderByDescending(o => o.FechaCreacion)
            .FirstOrDefaultAsync();

        if (otp == null)
            return false;

        otp.EsVerificado = 1ul;
        otp.FechaVerificacion = now;
        
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<bool> DecrementIntentosAsync(int idVerificacion)
    {
        var otp = await _context.EmailVerificacionesOtp
            .FirstOrDefaultAsync(o => o.IdVerificacion == idVerificacion);

        if (otp == null)
            return false;

        otp.IntentosRestantes = Math.Max(0, otp.IntentosRestantes - 1);
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<int> GetDailyAttemptsCountAsync(string email)
    {
        var yesterday = DateTime.UtcNow.AddDays(-1);
        
        return await _context.EmailVerificacionesOtp
            .Where(o => o.Email == email && o.FechaCreacion > yesterday)
            .CountAsync();
    }

    public async Task RevokeActiveOtpsAsync(string email)
    {
        var now = DateTime.UtcNow;
        
        var activeOtps = await _context.EmailVerificacionesOtp
            .Where(o => o.Email == email 
                && o.EsVerificado == 0ul 
                && o.FechaExpiracion > now)
            .ToListAsync();

        foreach (var otp in activeOtps)
        {
            otp.IntentosRestantes = 0;
        }

        if (activeOtps.Any())
        {
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> IsEmailVerifiedAsync(string email)
    {
        return await _context.EmailVerificacionesOtp
            .AnyAsync(o => o.Email == email && o.EsVerificado == 1ul);
    }
}
