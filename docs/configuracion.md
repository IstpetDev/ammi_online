# Configuración del servidor para la actualización

El servidor IIS conserva sus propios `appsettings*.json`; el despliegue no los sobrescribe. Los archivos versionados tienen vacíos los campos sensibles. Tras incorporar el backend actualizado, revisar manualmente estas claves en la configuración del servidor:

| Clave | Uso |
| --- | --- |
| `EmailSettings:AdminEmail` | Destinatario opcional de copia de las notificaciones de registro de pagos a crédito. Si queda vacío, no se envía esa copia. |
| `AllowedHosts` | Lista de nombres de host permitidos separados por punto y coma. En producción debe contener `ammionline.ammi.edu.ec;localhost` para restringir el acceso a los hosts reales y permitir las comprobaciones internas de salud (`deploy-ammionline.ps1`), eliminando el comodín `*`. En desarrollo se limita a `localhost;127.0.0.1`. |
| `Cors:AllowedOrigins` | Lista (o cadena separada por comas o punto y coma) de orígenes web autorizados para interactuar con la API con credenciales. En producción se restringe únicamente al dominio institucional `https://ammionline.ammi.edu.ec` (sin orígenes `localhost`). En desarrollo incluye orígenes locales como `http://localhost:4200`. |

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

## Revisión de esquema antes de desplegar

El modelo del backend nuevo añade entidades para cliente, verificación de correo, estado de matrícula, estado de pago y malla paralelo; también retira entidades antiguas de contenido de malla, alergias y tipo de sangre. Hay que comparar el esquema real de la base de datos con esas entidades antes de desplegar. Esta actualización no incluye migraciones ni modifica datos.

## Rutas web públicas

Además de `login`, `acelerado-virtual` y `formal-virtual`, el frontend tiene `verify-email-token`, `forgot-password` y `reset-password` sin guardia de autenticación. El PR #13 propone crear carpetas para las primeras tres rutas; mientras siga sin fusionarse, el workflow de `develop` no las crea. No se modifica ese workflow en estos PR.

El script de seguimiento permanece fuera del paquete y no se enlaza desde `index.html`. Los archivos de diseño PSD y AI, `.htaccess` y `web.config` de `public/` también quedan excluidos.
