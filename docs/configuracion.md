# Configuración del servidor para la actualización

El servidor IIS conserva sus propios `appsettings*.json`; el despliegue no los sobrescribe. Los archivos versionados tienen vacíos los campos sensibles. Tras incorporar el backend actualizado, revisar manualmente estas claves en la configuración del servidor:

| Clave | Uso |
| --- | --- |
| `EmailSettings:AdminEmail` | Destinatario opcional de copia de las notificaciones de registro de pagos a crédito. Si queda vacío, no se envía esa copia. |
| `AllowedHosts` | Lista de nombres de host permitidos separados por punto y coma. En producción debe contener `ammionline.ammi.edu.ec;localhost` para restringir el acceso a los hosts reales y permitir las comprobaciones internas de salud (`deploy-ammionline.ps1`), eliminando el comodín `*`. En desarrollo se limita a `localhost;127.0.0.1`. |
| `Cors:AllowedOrigins` | Lista (o cadena separada por comas o punto y coma) de orígenes web autorizados para interactuar con la API con credenciales. En producción se restringe únicamente al dominio institucional `https://ammionline.ammi.edu.ec` (sin orígenes `localhost`). En desarrollo incluye orígenes locales como `http://localhost:4200`. |
| `Logging:LogLevel:Microsoft.EntityFrameworkCore.Database.Command` | Nivel de registro de comandos SQL de EF Core. En producción debe configurarse en `Warning` para evitar registrar consultas que contengan datos personales o sensibles. En desarrollo se mantiene en `Information`. |
| `Logging:LogLevel:AMMI_Online_API` | Nivel de registro del código de la API. En producción se establece en `Information` (evitando `Debug`). En desarrollo se mantiene en `Debug`. |
| `ConnectionStrings:DefaultConnection` | Cadena de conexión a MySQL. Nunca debe incluirse en archivos versionados. En desarrollo usar `dotnet user-secrets` o variables de entorno. En producción se define en el servidor IIS. |
| `JwtSettings:SecretKey` | Clave criptográfica para firma de tokens JWT (mínimo 256 bits). Nunca debe incluirse en archivos versionados. |
| `EmailSettings:Password` | Contraseña del servicio SMTP de correo. Se administra exclusivamente en el servidor. |
| `ForwardedHeaders:KnownProxies` | Lista de IPs de proxies inversos de confianza (ej. balanceadores, Nginx, Cloudflare). Si se deja vacío, confía únicamente en loopback (`127.0.0.1`, `::1`). |
| `ForwardedHeaders:KnownNetworks` | Lista de rangos CIDR de proxies de confianza (ej. `["10.0.0.0/8"]`). |
| `ForwardedHeaders:ForwardLimit` | Número máximo de saltos permitidos en encabezados reenviados (por defecto: `1`). |
| `RateLimiting:AuthPolicy:PermitLimit` | Número de peticiones permitidas por minuto por IP para endpoints de credenciales/login (por defecto: `10` en producción, `20` en desarrollo). |
| `RateLimiting:OtpPolicy:PermitLimit` | Número de peticiones permitidas por minuto por IP para endpoints de verificación OTP (por defecto: `5` en producción, `10` en desarrollo). |
| `AuthSecurity:MaxFailedAttempts` | Intentos fallidos consecutivos permitidos antes de activar el bloqueo temporal (por defecto: `5`). |
| `AuthSecurity:LockoutDurationMinutes` | Duración del bloqueo temporal en minutos (por defecto: `15`). |

La nueva versión sigue usando las claves existentes `ConnectionStrings:DefaultConnection`, `JwtSettings:SecretKey`, `JwtSettings:Issuer`, `JwtSettings:Audience`, `EmailSettings:Host`, `EmailSettings:Port`, `EmailSettings:FromEmail`, `EmailSettings:Password`, `EmailSettings:SenderName` y `EmailSettings:EnableSsl`. Sus valores se administran únicamente en el servidor.

## Gestión de Secretos y Configuración Local

Para impedir la filtración accidental de credenciales en el repositorio:

1. **Plantilla de configuración (`appsettings.example.json`):**
   - Sirve como modelo versionado para documentar la estructura esperada de la configuración.
   - Todos los campos sensibles (`ConnectionStrings`, `SecretKey`, `Password`) deben permanecer vacíos (`""`).

2. **Archivos ignorados en Git (`.gitignore`):**
   - Se ignoran `appsettings.local.json`, `appsettings.*.local.json` y `appsettings.Production.json`.
   - Cualquier archivo de desarrollo que contenga valores reales de prueba debe nombrarse con sufijo `.local.json` para que Git lo ignore automáticamente.

3. **Desarrollo con `dotnet user-secrets` y variables de entorno:**
   - El proyecto API tiene configurado `UserSecretsId` (`ammi-online-api-secrets-2026`).
   - Para configurar secretos en desarrollo local sin tocar archivos del repositorio:
     ```bash
     dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<cadena_de_conexion_local>" --project src/Backend/src/AMMI_Online_API.API
     dotnet user-secrets set "JwtSettings:SecretKey" "<clave_secreta_jwt_local>" --project src/Backend/src/AMMI_Online_API.API
     dotnet user-secrets set "EmailSettings:Password" "<password_smtp_local>" --project src/Backend/src/AMMI_Online_API.API
     ```
   - En entornos automatizados o contenedores se pueden usar variables de entorno estándar de ASP.NET Core: `ConnectionStrings__DefaultConnection`, `JwtSettings__SecretKey`, etc.

4. **Validaciones automáticas en CI:**
   - **Gitleaks:** `.gitleaks.toml` contiene reglas específicas para detectar cadenas de conexión que incluyan contraseñas (`password=`, `pwd=`) y claves JWT configuradas, respaldadas por pruebas en `.github/scripts/pruebas/validar-gitleaks.test.sh`.
   - **Verificación de archivos versionados:** El script `.github/scripts/validar-secretos-appsettings.sh` se ejecuta en el pipeline e invalida cualquier PR si un archivo `appsettings*.json` versionado tiene valores no vacíos en `ConnectionStrings`, `JwtSettings:SecretKey` o `EmailSettings:Password`.

## Procedimiento de Rotación de Credenciales

En caso de requerir una rotación periódica o tras sospecha de filtración de credenciales:

### 1. Rotación de Cadena de Conexión a Base de Datos (MySQL)

1. **Crear o actualizar usuario en MySQL:**
   - Para rotación sin interrupción (*zero-downtime*): crear un usuario alterno con permisos sobre la base de datos o definir una contraseña secundaria si la versión de MySQL lo soporta (`ALTER USER ... RETAIN CURRENT PASSWORD`).
2. **Actualizar el servidor de producción:**
   - Modificar la clave `ConnectionStrings:DefaultConnection` en el `appsettings.json` local del servidor IIS (`C:\inetpub\wwwroot\apiAmmiOnline\appsettings.json`) o mediante variable de entorno de máquina.
3. **Reciclar el grupo de aplicaciones (Application Pool):**
   ```powershell
   Restart-WebAppPool -Name DefaultAppPool
   ```
4. **Verificar la conectividad:**
   - Comprobar que los endpoints de consulta respondan correctamente (`Estado-Http` / logs de IIS).
5. **Revocar credencial anterior:**
   - Una vez confirmada la operación con la nueva credencial, eliminar el usuario antiguo o revocar la contraseña previa en MySQL.

### 2. Rotación de Clave JWT (`JwtSettings:SecretKey`)

1. **Generar una nueva clave:**
   - Generar una cadena criptográficamente segura de al menos 256 bits (32 bytes en Base64 o alfanumérica de más de 32 caracteres).
2. **Actualizar en el servidor:**
   - Configurar la nueva clave en `appsettings.json` del servidor IIS (`JwtSettings:SecretKey`).
3. **Reiniciar el Application Pool de IIS.**
4. **Impacto en usuarios:**
   - Los tokens emitidos con la clave anterior quedarán invalidados inmediatamente; los usuarios activos deberán iniciar sesión nuevamente para obtener un nuevo token firmado con la clave vigente.

### 3. Rotación de Credenciales SMTP (`EmailSettings:Password`)

1. **Actualizar la contraseña en el proveedor de correo institucional.**
2. **Actualizar `EmailSettings:Password` en el `appsettings.json` del servidor IIS.**
3. **Reiniciar el Application Pool y ejecutar una prueba de envío (e.g. solicitud de recuperación de contraseña).**

### 4. Protocolo ante Exposición Accidental en Git

1. **Avisar inmediatamente al responsable de seguridad e infraestructura.**
2. **Rotar de inmediato la credencial en el servicio de destino (MySQL, correo, etc.).**
3. **Recordatorio:** Borrar el secreto en un commit posterior no elimina la exposición en el historial de Git. Si el secreto entró a una rama remota, la credencial debe considerarse comprometida y ser revocada sin excepción.

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


## Configuración de Proxy Inverso, Rate Limiting y Bloqueo Temporal (Issue #24)

### 1. Detección de IP Real (`ForwardedHeaders`)
Cuando la API opera detrás de un proxy inverso (IIS ARR, Nginx, Cloudflare, Traefik o Docker), los clientes se comunican con el proxy y este reenvía la petición al backend. 
- Para evitar que la limitación de tasa bloquee la IP del proxy (afectando a todos los usuarios), el middleware `ForwardedHeaders` lee `X-Forwarded-For` y `X-Forwarded-Proto`.
- **Protección contra IP Spoofing:** El middleware únicamente acepta encabezados `X-Forwarded-For` que provengan de direcciones IP registradas en `ForwardedHeaders:KnownProxies` o `ForwardedHeaders:KnownNetworks`. Las cabeceras enviadas directamente por clientes no autorizados son descartadas.

### 2. Políticas de Límite de Tasa (`RateLimiting`)
Se ejecutan mediante `Microsoft.AspNetCore.RateLimiting` aplicando ventanas deslizantes (*Sliding Window*) particionadas por cliente:
- `auth-policy`: 10 req/min por IP sobre `/api/Auth/login`, `/api/Auth/register`, `/api/Auth/forgot-password` y `/api/Auth/reset-password`.
- `otp-policy`: 5 req/min por IP sobre `/api/EmailVerification/*`.
- `catalog-policy`: 120 req/min por IP sobre catálogos públicos.
- Ante exceso, responde con estado HTTP 429 y cabecera `Retry-After`.

### 3. Bloqueo Temporal por Fuerza Bruta (`AuthSecurity`)
- Rastrea fallos tanto por identificador de cuenta (`username` o `email`) como por `IP`.
- Si un atacante intenta adivinar credenciales 5 veces seguidas, tanto la IP como la cuenta quedan bloqueadas durante 15 minutos.
- **Prevención de Enumeración:** Los mensajes de fallo antes y después del bloqueo no revelan si el usuario existe en el sistema.
- **Invalidación Inmediata de Tokens:** Los tokens de reseteo de contraseña se limpian de la base de datos tras su consumo (`ClearResetTokenAsync`); los tokens y códigos OTP se marcan como verificados (`EsVerificado = 1ul`), impidiendo cualquier reutilización.
