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
| `FileSettings:MaxFileSize` | Límite de tamaño global por defecto en bytes para subida de archivos (por defecto: `10485760` / 10MB). |
| `FileSettings:MaxFileSizeByExtension` | Cuotas máximas de tamaño por extensión (ej. 5MB para imágenes `.jpg`/`.png` y 10MB para documentos `.pdf`/`.docx`). |
| `FileSettings:AllowedExtensions` | Lista blanca de extensiones permitidas para almacenamiento general. |

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

## Validación de Contenido de Archivos y Seguridad de Subidas (Issue #23)

### 1. Validación Centralizada (`IFileValidationService`)
Todos los endpoints que reciben archivos (adjuntos generales, documentos personales, fotos de perfil, discapacidad, comprobantes de pago y postulaciones) procesan los flujos a través del servicio único `IFileValidationService`:
- **Comprobación de firmas (*magic numbers*):** Compara los primeros bytes de encabezado binario del archivo contra la firma correspondiente al tipo declarado (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.doc`, `.docx`, etc.).
- **Bloqueo incondicional de ejecutables:** Rechaza de inmediato archivos con cabeceras ejecutables de Windows (PE / MZ), Linux (ELF) o scripts con intérprete Unix (`#!`), así como scripts en general.
- **Detección de mismatch:** Rechaza archivos cuyo contenido real no corresponda con la extensión declarada (ej. un PDF renombrado como `.png`).

### 2. Cuotas por Tipo y Sanitización de Nombres
- **Límites por tipo de archivo (`MaxFileSizeByExtension`):** Permite configurar cuotas independientes por extensión (ej. 5 MB para imágenes y 10 MB para documentos).
- **Sanitización contra Path Traversal:** Elimina prefijos de rutas (`/`, `\`), suprime cualquier secuencia `..` y purga caracteres inválidos o de control del sistema de archivos.
- **Nombres seguros en disco:** El nombre en almacenamiento físico se genera exclusivamente en el servidor mediante un GUID único (`{guid}{ext}`), asegurando que el nombre del cliente nunca determine la ruta ni el nombre en disco.

### 3. Descarga Segura
- Los endpoints de descarga autenticada (`/api/Adjuntos/{id}` y `/api/Adjuntos/by-path`) retornan obligatoriamente los encabezados de endurecimiento:
  * `X-Content-Type-Options: nosniff`: Previene que el navegador interprete o ejecute contenido como un tipo MIME distinto al configurado.
  * `Content-Disposition: attachment; filename="..."`: Fuerza la descarga como archivo adjunto en lugar de su renderizado inline.

### 4. Decisión sobre Análisis Antivirus (`EnableVirusScan`)
- Se retiró la opción inoperante `"EnableVirusScan": false` de los archivos `appsettings*.json`.
- Al no contar la infraestructura con un daemon o socket de escaneo antivirus local (ej. ClamAV), mantener una bandera booleana desactivada inducía a falsas expectativas de configuración.
- La protección activa reside en la validación binaria criptográfica de firmas, la lista blanca de extensiones, el renombrado con GUID y el aislamiento de rutas. El análisis antivirus avanzado se recomienda a nivel perimetral de infraestructura (Defender en Windows Server / IIS, o Cloud Storage Defender en S3/Azure Blob).

## Almacenamiento Externo y Descarga Exclusiva Autenticada (Issue #21)

### 1. Eliminación de Servicio Estático sobre `/Uploads`
- Se eliminó la directiva `UseStaticFiles` sobre la carpeta `/Uploads` en `Program.cs`.
- Ningún archivo puede descargarse o inspeccionarse estáticamente sin pasar por el pipeline de autenticación y autorización de ASP.NET Core.

### 2. Control de Acceso y Propiedad de Archivos
- Las descargas se realizan a través de `AdjuntosController`:
  * `GET /api/Adjuntos/{id}`: descarga por identificador numérico de adjunto.
  * `GET /api/Adjuntos/by-path?path={ruta}`: descarga por ruta almacenada en base de datos.
- Requisitos de seguridad aplicados en cada petición:
  * **Sesión obligatoria:** Sin token JWT válido se responde inmediatamente con código de estado HTTP 401 Unauthorized.
  * **Comprobación de autorización:** Mediante `IAdjuntosAuthorizationService`, se verifica que el usuario autenticado sea el dueño del recurso (`DocumentosPersonales`, `PersonaDiscapacidad` o `Pago`) o posea un rol administrativo autorizado (`Administrador`, `SuperAdmin`, `Personal`, `Docente`).
  * **Aislamiento entre usuarios:** Si un usuario intenta acceder a un archivo ajeno, la API deniega el acceso respondiendo con HTTP 403 Forbidden.

### 3. Configuración de Almacenamiento Fuera de la Publicación
- Parámetros en `appsettings.json`:
  * `FileSettings:UploadPath`: `"../Uploads"`
  * `StorageSettings:Local:BasePath`: `"../Uploads"`
- En entornos de producción (IIS), al estar configurado en `"../Uploads"` frente a `ContentRootPath` (`C:\inetpub\wwwroot\apiAmmiOnline`), el almacenamiento se ubica automáticamente en `C:\inetpub\wwwroot\Uploads`, quedando fuera de la carpeta publicada de la aplicación.
- Es configurable por entorno mediante la variable `FileSettings__UploadPath` o en `appsettings.{Environment}.json`, admitiendo rutas absolutas o relativas.

### 4. Resiliencia de Arranque y Tolerancia a Fallos
- `Program.cs` ya no utiliza `PhysicalFileProvider` al inicio, por lo que la aplicación arranca sin errores incluso si la carpeta de almacenamiento aún no ha sido creada en el entorno de despliegue. Las subcarpetas necesarias se crean de forma segura bajo demanda.

### 5. Compatibilidad Histórica de Rutas
- El servicio `IFileStoragePathService` resuelve dinámicamente las rutas registradas en base de datos: si un archivo histórico se encuentra en el directorio legacy (`ContentRootPath/Uploads`), lo sirve sin pérdida de información; si fue migrado o es una nueva subida, lo sirve desde la carpeta de almacenamiento configurada.
- No se requieren cambios en el esquema ni migraciones manuales de base de datos.


## Prueba de Humo en Dominio Público y Retroceso Automático (Issue #30)

Tras cada despliegue a producción en el workflow `.github/workflows/deploy.yml`, se ejecuta una prueba de humo automatizada (`.github/scripts/prueba-humo.sh`) sobre el dominio público configurado (`vars.PUBLIC_URL` o por defecto `https://ammionline.ammi.edu.ec`):

### 1. Rutas y Recursos Verificados

| Componente | Ruta / Recurso | Método HTTP | Código Esperado | Propósito |
| :--- | :--- | :---: | :---: | :--- |
| **Página principal** | `/` | `GET` | `200 OK` | Valida conectividad perimetral, SSL/TLS y entrega del archivo raíz de la aplicación. |
| **Rutas públicas SPA** | `/login`<br>`/acelerado-virtual`<br>`/formal-virtual`<br>`/forgot-password`<br>`/reset-password`<br>`/verify-email-token` | `GET` | `200 OK` | Garantiza que las rutas públicas del enrutador Angular resuelvan correctamente sin errores 404 ni bucles. |
| **API Backend** | `/apiAmmiOnline/api/Auth/login` | `GET` | `405 Method Not Allowed` | Confirma que la API ASP.NET Core está activa, responde en su ruta pública y rechaza métodos no permitidos. |
| **Recurso estático** | `main-*.js` | `GET` | `200 OK` | Extrae dinámicamente el nombre del script principal compilado y verifica que el servidor entregue los bundles estáticos. |

### 2. Privacidad y Seguridad en Logs Públicos

Para cumplir con la política de seguridad del repositorio (cuyos logs de GitHub Actions son públicos):
- Todas las peticiones HTTP se ejecutan con `curl -s -L -o /dev/null -w '%{http_code}'`.
- **Bajo ninguna circunstancia se imprimen cuerpos de respuesta HTML**, respuestas JSON, encabezados confidenciales del servidor ni trazas de error.
- La salida de consola y el resumen de GitHub Actions (`$GITHUB_STEP_SUMMARY`) registran únicamente el método, ruta, código esperado, código obtenido y estado final (`OK` / `FALLO`).

### 3. Reintentos y Tolerancia a Fallos Transitorios

- La prueba incluye reintentos automáticos (hasta 3 intentos con 5 segundos de espera entre cada uno) para tolerar el tiempo de reciclaje del grupo de aplicaciones de IIS (*Application Pool*) o retrasos de propagación del proxy inverso.

### 4. Retroceso Automático (*Rollback*) y Alertas

- Si alguna de las comprobaciones falla tras los reintentos:
  1. El job de despliegue activa automáticamente el paso condicional `Retroceso automático y alerta` (`if: failure() && steps.smoke_test.outcome == 'failure'`).
  2. Mediante la conexión SSH previa, se invoca `deploy-ammionline.ps1 -Rollback <id>` sobre el respaldo generado inmediatamente antes del despliegue.
  3. Si está configurado el secreto `ALERTA_DESPLIEGUE_WEBHOOK`, se envía una notificación inmediata al canal del equipo (Slack, Discord, Microsoft Teams o Google Chat).
  4. El job finaliza en estado rojo (`failure`) y el resumen en `$GITHUB_STEP_SUMMARY` detalla con precisión las rutas que provocaron el fallo.
