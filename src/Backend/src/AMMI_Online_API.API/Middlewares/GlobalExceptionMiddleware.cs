using AMMI_Online_API.Application.Common.Exceptions;
using AMMI_Online_API.Application.Common.Wrapper;
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Text.Json;

namespace AMMI_Online_API.API.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
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
            context.Response.ContentType = "application/json";

            // Configurar ExceptionHandler si no está configurado
            if (ExceptionHandler.GetSpecificErrorMessage == null)
            {
                ExceptionHandler.Configure(_logger);
            }

            var errorMessage = ExceptionHandler.GetSpecificErrorMessage(exception);
            ExceptionHandler.LogDetailedError(_logger, exception);

            var response = Response<object>.Failure(errorMessage);

            // Mapear tipos de excepción a códigos HTTP
            context.Response.StatusCode = exception switch
            {
                KeyNotFoundException => (int)HttpStatusCode.NotFound,
                UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
                ValidationException => (int)HttpStatusCode.BadRequest,
                _ => (int)HttpStatusCode.InternalServerError
            };

            var result = JsonSerializer.Serialize(response);
            await context.Response.WriteAsync(result);
        }
    }
}