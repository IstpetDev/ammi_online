using AMMI_Online_API.Application.Common.Wrapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MySqlConnector;
using System.ComponentModel.DataAnnotations;

namespace AMMI_Online_API.Application.Common.Exceptions
{
    public static class ExceptionHandler
    {
        private static ILogger _logger;

        public static void Configure(ILogger logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public static async Task<Response<T>> HandleExceptionAsync<T>(
            Func<Task<T>> action,
            string successMessage = null)
        {
            try
            {
                var result = await action();
                return Response<T>.Success(result, successMessage ?? "Operación exitosa");
            }
            catch (Exception ex)
            {
                if (_logger == null)
                {
                    using var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
                    _logger = loggerFactory.CreateLogger("ExceptionHandler");
                }

                LogDetailedError(_logger, ex);
                string errorMessage = GetSpecificErrorMessage(ex);
                return Response<T>.Failure(errorMessage);
            }
        }

        public static string GetSpecificErrorMessage(Exception ex, bool isDevelopment = false)
        {
            return ex switch
            {
                ArgumentNullException argEx => isDevelopment
                    ? $"Valor requerido no proporcionado: {argEx.ParamName}"
                    : "Datos requeridos no proporcionados",
                InvalidOperationException customEx => isDevelopment
                    ? customEx.Message
                    : "Operación no válida",
                DbUpdateException dbEx => GetDbUpdateErrorMessage(dbEx, isDevelopment),
                MySqlException sqlEx => GetMySqlErrorMessage(sqlEx, isDevelopment),
                ValidationException valEx => $"Error de validación: {valEx.Message}",
                KeyNotFoundException _ => "Registro no encontrado",
                UnauthorizedAccessException _ => "No tiene permisos para esta acción",
                TimeoutException _ => "Tiempo de espera agotado",
                _ => isDevelopment ? $"{ex.GetType().Name}: {ex.Message}" : "Error interno del servidor"
            };
        }

        private static string GetDbUpdateErrorMessage(DbUpdateException ex, bool isDevelopment)
        {
            Exception current = ex;
            while (current != null)
            {
                if (current is MySqlException sqlEx) return GetMySqlErrorMessage(sqlEx, isDevelopment);
                current = current.InnerException;
            }

            string msg = ex.InnerException?.Message ?? ex.Message;
            return msg.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                ? "Registro duplicado"
                : (isDevelopment ? msg : "Error al actualizar la base de datos");
        }

        private static string GetMySqlErrorMessage(MySqlException ex, bool isDevelopment)
        {
            return ex.Number switch
            {
                1062 => "Registro duplicado",
                1451 => "No se puede eliminar, tiene registros relacionados",
                1452 => "Referencia a registro inexistente",
                _ => isDevelopment ? $"Error de base de datos (Código: {ex.Number}): {ex.Message}" : "Error de base de datos"
            };
        }

        public static void LogDetailedError(ILogger logger, Exception ex)
        {
            if (logger == null) return;

            string message = ex switch
            {
                DbUpdateException dbEx => $"Error BD: {dbEx.InnerException?.Message ?? dbEx.Message}",
                MySqlException sqlEx => $"MySQL {sqlEx.Number}: {sqlEx.Message}",
                ValidationException valEx => $"Validación: {valEx.Message}",
                _ => $"{ex.GetType().Name}: {ex.Message}"
            };

            logger.LogError(ex, message);
        }
    }
}
