# Configuración del servidor para la actualización

El servidor IIS conserva sus propios `appsettings*.json`; el despliegue no los sobrescribe. Los archivos versionados tienen vacíos los campos sensibles. Tras incorporar el backend actualizado, revisar manualmente estas claves en la configuración del servidor:

| Clave | Uso |
| --- | --- |
| `EmailSettings:AdminEmail` | Destinatario opcional de copia de las notificaciones de registro de pagos a crédito. Si queda vacío, no se envía esa copia. |

La nueva versión sigue usando las claves existentes `ConnectionStrings:DefaultConnection`, `JwtSettings:SecretKey`, `JwtSettings:Issuer`, `JwtSettings:Audience`, `EmailSettings:Host`, `EmailSettings:Port`, `EmailSettings:FromEmail`, `EmailSettings:Password`, `EmailSettings:SenderName` y `EmailSettings:EnableSsl`. Sus valores se administran únicamente en el servidor.

## Revisión de esquema antes de desplegar

El modelo del backend nuevo añade entidades para cliente, verificación de correo, estado de matrícula, estado de pago y malla paralelo; también retira entidades antiguas de contenido de malla, alergias y tipo de sangre. Hay que comparar el esquema real de la base de datos con esas entidades antes de desplegar. Esta actualización no incluye migraciones ni modifica datos.

## Rutas web públicas

Además de `login`, `acelerado-virtual` y `formal-virtual`, el frontend tiene `verify-email-token`, `forgot-password` y `reset-password` sin guardia de autenticación. El workflow actual solo crea carpetas para las primeras tres rutas. No se modifica ese workflow en estos PR.

El script de seguimiento permanece fuera del paquete y no se enlaza desde `index.html`. Los archivos de diseño PSD y AI, `.htaccess` y `web.config` de `public/` también quedan excluidos.
