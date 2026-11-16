using AMMI_Online_API.Application.Common.Exceptions;
using AMMI_Online_API.Application.Common.Wrapper;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Text.Json;

namespace AMMI_Online_API.API.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public GlobalExceptionMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionMiddleware> logger,
            IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            // Registrar error con traza completa en el log interno del servidor para diagnóstico
            ExceptionHandler.LogDetailedError(_logger, exception);

            context.Response.ContentType = "application/json";

            var isDevelopment = _environment.IsDevelopment();
            var statusCode = exception switch
            {
                KeyNotFoundException => HttpStatusCode.NotFound,
                UnauthorizedAccessException => HttpStatusCode.Unauthorized,
                ValidationException => HttpStatusCode.BadRequest,
                TimeoutException => HttpStatusCode.RequestTimeout,
                _ => HttpStatusCode.InternalServerError
            };

            context.Response.StatusCode = (int)statusCode;

            string errorMessage;
            if (isDevelopment)
            {
                errorMessage = ExceptionHandler.GetSpecificErrorMessage(exception, isDevelopment: true);
            }
            else
            {
                // En producción: mensajes sanitizados sin trazas, códigos SQL ni detalles internos del servidor
                errorMessage = statusCode switch
                {
                    HttpStatusCode.BadRequest => exception is ValidationException valEx
                        ? $"Error de validación: {valEx.Message}"
                        : "Solicitud incorrecta",
                    HttpStatusCode.NotFound => "Registro no encontrado",
                    HttpStatusCode.Unauthorized => "No tiene permisos para esta acción",
                    HttpStatusCode.RequestTimeout => "Tiempo de espera agotado",
                    _ => "Ha ocurrido un error interno en el servidor."
                };
            }

            var response = Response<object>.Failure(errorMessage);
            response.StatusCode = statusCode;

            var result = JsonSerializer.Serialize(response);
            await context.Response.WriteAsync(result);
        }
    }
}
