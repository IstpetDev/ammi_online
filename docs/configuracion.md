# Configuración del servidor para la actualización

El servidor IIS conserva sus propios `appsettings*.json`; el despliegue no los sobrescribe. Los archivos versionados tienen vacíos los campos sensibles. Tras incorporar el backend actualizado, revisar manualmente estas claves en la configuración del servidor:

| Clave | Uso |
| --- | --- |
| `EmailSettings:AdminEmail` | Destinatario opcional de copia de las notificaciones de registro de pagos a crédito. Si queda vacío, no se envía esa copia. |
| `AllowedHosts` | Lista de nombres de host permitidos separados por punto y coma. En producción debe contener `ammionline.ammi.edu.ec;localhost` para restringir el acceso a los hosts reales y permitir las comprobaciones internas de salud (`deploy-ammionline.ps1`), eliminando el comodín `*`. En desarrollo se limita a `localhost;127.0.0.1`. |
| `Cors:AllowedOrigins` | Lista (o cadena separada por comas o punto y coma) de orígenes web autorizados para interactuar con la API con credenciales. En producción se restringe únicamente al dominio institucional `https://ammionline.ammi.edu.ec` (sin orígenes `localhost`). En desarrollo incluye orígenes locales como `http://localhost:4200`. |
| `Logging:LogLevel:Microsoft.EntityFrameworkCore.Database.Command` | Nivel de registro de comandos SQL de EF Core. En producción debe configurarse en `Warning` para evitar registrar consultas que contengan datos personales o sensibles. En desarrollo se mantiene en `Information`. |
| `Logging:LogLevel:AMMI_Online_API` | Nivel de registro del código de la API. En producción se establece en `Information` (evitando `Debug`). En desarrollo se mantiene en `Debug`. |

La nueva versión sigue usando las claves existentes `ConnectionStrings:DefaultConnection`, `JwtSettings:SecretKey`, `JwtSettings:Issuer`, `JwtSettings:Audience`, `EmailSettings:Host`, `EmailSettings:Port`, `EmailSettings:FromEmail`, `EmailSettings:Password`, `EmailSettings:SenderName` y `EmailSettings:EnableSsl`. Sus valores se administran únicamente en el servidor.

## Política CORS y Filtrado de Hosts

La política CORS se denomina `FrontendPolicy` (`CorsExtensions.PolicyName`) en sustitución de la anterior política fija `AngularDev`, permitiendo que la configuración sea dinámica según el entorno:

- **Producción (`appsettings.json` o configuración del servidor IIS):**
  - `Cors:AllowedOrigins`: Únicamente `https://ammionline.ammi.edu.ec`. Se elimina `localhost` del entorno productivo para mitigar riesgos de seguridad por acceso no autorizado desde entornos locales.
  - `AllowedHosts`: `ammionline.ammi.edu.ec;localhost`. Se restringe el comodín `*` a los hosts reales, garantizando tanto las peticiones del dominio público como las verificaciones locales de IIS por script de despliegue.
- **Desarrollo (`appsettings.Development.json`):**
  - `Cors:AllowedOrigins`: Orígenes locales de desarrollo (`http://localhost:4200`, `https://localhost:4200`, `http://localhost`, `https://localhost`).
  - `AllowedHosts`: `localhost;127.0.0.1`.
- **Flexibilidad de lectura:**
  - El lector de configuración `CorsExtensions.GetAllowedOrigins` admite tanto listas JSON (`Cors:AllowedOrigins`) como cadenas separadas por coma o punto y coma (`Cors:AllowedOrigins` o `Cors__AllowedOrigins`), facilitando la sobreescritura mediante variables de entorno de sistema.

## Niveles de Registro, Retención de Logs y Manejo de Errores

Para proteger datos personales sensibles (cédulas, credenciales, datos de contacto) y evitar la exposición de infraestructura interna:

- **Niveles de registro por entorno:**
  - **Producción (`appsettings.json`):**
    - `Microsoft.EntityFrameworkCore.Database.Command`: Fijado en `Warning`. Esto suprime el registro de consultas SQL y parámetros de EF Core en consola y archivos, evitando la filtración de datos confidenciales y personales en los logs.
    - `AMMI_Online_API`: Fijado en `Information`. Se desactiva el nivel `Debug` en entornos productivos.
    - `Microsoft.AspNetCore`: `Warning`.
    - `Default`: `Information`.
  - **Desarrollo (`appsettings.Development.json`):**
    - `Microsoft.EntityFrameworkCore.Database.Command`: `Information` (permite inspección de sentencias SQL en depuración).
    - `AMMI_Online_API`: `Debug`.
- **Privacidad y datos sensibles en logs:**
  - Se garantiza que el código de la aplicación no registra contraseñas, tokens JWT, números de cédula ni cuerpos de solicitud (*request bodies*).
  - La supresión de comandos EF Core en producción previene cualquier fuga incidental de datos en operaciones de inserción o actualización.
- **Rotación y retención de logs (`logs/`):**
  - La carpeta `C:\inetpub\wwwroot\apiAmmiOnline\logs` preserva su contenido entre despliegues.
  - Se establece una política de retención de **30 días**: el script de despliegue `deploy-ammionline.ps1` depura automáticamente los archivos de log con más de 30 días de antigüedad durante cada despliegue.
  - La rotación de archivos de salida de IIS (stdout) se gestiona por fecha y proceso. En producción se recomienda mantener `stdoutLogEnabled="false"` en `web.config` y activarlo únicamente de forma temporal para diagnósticos.
- **Respuestas de error hacia el cliente (`GlobalExceptionMiddleware`):**
  - Todas las excepciones no controladas se registran internamente con su traza completa (`StackTrace`) y detalles técnicos en el logger del servidor.
  - En producción, las respuestas HTTP al cliente devuelven mensajes sanitizados sin trazas de pila, sin mensajes de error de la base de datos MySQL y sin detalles internos de infraestructura:
    - Errores 500 (*Internal Server Error*): Devuelven un mensaje genérico `"Ha ocurrido un error interno en el servidor."`.
    - Errores 400 (*Bad Request*): Solo exponen mensajes de validación explícitos del modelo de negocio (`ValidationException`).
    - Errores 404 y 401: Mensajes genéricos `"Registro no encontrado"` y `"No tiene permisos para esta acción"`.
  - En desarrollo, se incluye la tipología del error para agilizar la depuración.

## Revisión de esquema antes de desplegar

El modelo del backend nuevo añade entidades para cliente, verificación de correo, estado de matrícula, estado de pago y malla paralelo; también retira entidades antiguas de contenido de malla, alergias y tipo de sangre. Hay que comparar el esquema real de la base de datos con esas entidades antes de desplegar. Esta actualización no incluye migraciones ni modifica datos.

## Rutas web públicas

Además de `login`, `acelerado-virtual` y `formal-virtual`, el frontend tiene `verify-email-token`, `forgot-password` y `reset-password` sin guardia de autenticación. El PR #13 propone crear carpetas para las primeras tres rutas; mientras siga sin fusionarse, el workflow de `develop` no las crea. No se modifica ese workflow en estos PR.

El script de seguimiento permanece fuera del paquete y no se enlaza desde `index.html`. Los archivos de diseño PSD y AI, `.htaccess` y `web.config` de `public/` también quedan excluidos.
