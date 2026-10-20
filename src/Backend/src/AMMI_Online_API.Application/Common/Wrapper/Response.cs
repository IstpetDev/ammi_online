using System.Net;
using System.Text.Json.Serialization;

namespace AMMI_Online_API.Application.Common.Wrapper
{
    /// <summary>
    /// Esquema predeterminado de respuesta a una solicitud de la API que no devuelve valores.
    /// </summary>
    public class Response
    {
        public Response()
        {
            IsSuccess = true;
            StatusCode = HttpStatusCode.OK;
            Message = "Operación exitosa";
        }

        public Response(HttpStatusCode statusCode, string message)
        {
            IsSuccess = (int)statusCode >= 200 && (int)statusCode < 300;
            StatusCode = statusCode;
            Message = message;
        }
        /// <summary>
        /// Determina si la respuesta del mensaje es correcta o no.
        /// </summary>
        /// 
        [JsonPropertyName("isSuccess")]
        public bool IsSuccess { get; set; }

        /// <summary>
        /// Devuelve el código de estado Http de la respuesta del API
        /// </summary>
        [JsonPropertyName("statusCode")]
        public HttpStatusCode StatusCode { get; set; }
        /// <summary>
        /// Devuelve el mensaje de resultado de la respuesta de la solicitud.
        /// En el caso de errores se encuentra el mensaje para el cliente http solicitante.
        /// </summary>
        [JsonPropertyName("message")]
        public string Message { get; set; }

        [JsonPropertyName("errores")]
        public Dictionary<string, string[]> Errores { get; set; } = new();
    }
    /// <summary>
    /// Esquema predeterminado de respuesta a una solicitud de la API que devuelve un resultado de datos.
    /// </summary>
    /// <typeparam name="T">Tipo de datos del valor resultado de la respuesta.</typeparam>
    public sealed class Response<T> : Response
    {
        public Response() { }

        public Response(T data, string message = "Operación exitosa")
        {
            Data = data;
            Message = message;
            IsSuccess = true;
            StatusCode = HttpStatusCode.OK;
        }

        public Response(HttpStatusCode statusCode, string message)
            : base(statusCode, message) { }

        public static Response<T> Success(T data, string message)
        {
            return new Response<T>
            {
                Data = data,
                Message = message,
                IsSuccess = true,
                StatusCode = HttpStatusCode.OK
            };
        }

        public static Response<T> Failure(string errorMessage)
        {
            return new Response<T>
            {
                Data = default,
                Message = errorMessage,
                IsSuccess = false,
                StatusCode = HttpStatusCode.BadRequest
            };
        }

        /// <summary>
        /// Valor resultado de la respuesta a la solicitud de la API.
        /// </summary>
        [JsonPropertyName("data")]
        public T Data { get; set; }
    }
}