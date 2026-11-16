# ADR-0007: Servido de rutas de Angular mediante URL Rewrite en IIS y versionado de web.config

Fecha: 2026-10-30

Estado: Aceptado

## Contexto

En el Issue #29 se evidenció que la compilación estática de Angular en producción no genera carpetas por cada ruta del enrutador (`app.routes.ts`). Con anterioridad, un workaround en el flujo de trabajo CI/CD (`deploy.yml`) creaba manualmente un conjunto rígido de carpetas (`login`, `acelerado-virtual`, `formal-virtual`) duplicando en cada una el archivo `index.html`.

Esta aproximación presentaba serias limitaciones:
1. Cualquier otra ruta pública (`forgot-password`, `reset-password`, `verify-email-token`, `cambiar-contrasenia`) y todas las rutas internas y anidadas (`dashboard/*`) respondían con error HTTP 404 Not Found al ser accedidas directamente, mediante enlaces externos (como correos electrónicos de confirmación o recuperación de clave) o al recargar la página con F5.
2. El archivo `web.config` de la aplicación frontend no estaba versionado en el repositorio y se encontraba excluido en el script de despliegue (`deploy-ammionline.ps1`) dentro de `$NoTocarArchivos`, junto con el de la API.
3. Un intento previo de incorporar URL Rewrite (PR #7) utilizó el nombre de regla `Angular rutas`, lo cual causó una colisión y error HTTP `500.52 URL Rewrite Module Error` en IIS debido a una regla duplicada heredada en el servidor, teniendo que ser revertido (PR #9).

## Decisión

1. **Versionado de `web.config` en `src/Frontend/public/`:**
   - Se versiona el archivo de configuración oficial de IIS para la aplicación frontend en `src/Frontend/public/web.config`.
   - Angular lo incluye automáticamente en la raíz de salida (`dist/Ammi_Online/browser/web.config`) durante la compilación.
   - Conserva los tipos MIME requeridos por la aplicación (`.webp`, `.webmanifest`), las cabeceras de seguridad (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`) y el documento de inicio predeterminado (`index.html`).

2. **Regla de Reescritura `spa-fallback`:**
   - Se implementa una regla con el identificador unívoco `spa-fallback` para evitar cualquier colisión con directivas preexistentes en niveles superiores de IIS:
     ```xml
     <rewrite>
       <rules>
         <rule name="spa-fallback" stopProcessing="true">
           <match url=".*" />
           <conditions logicalGrouping="MatchAll">
             <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
             <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             <add input="{REQUEST_URI}" pattern="^/apiAmmiOnline" negate="true" />
             <add input="{REQUEST_URI}" pattern="\.[A-Za-z0-9]+$" negate="true" />
           </conditions>
           <action type="Rewrite" url="/appAmmiOnline/index.html" />
         </rule>
       </rules>
     </rewrite>
     ```
   - **Comportamiento:**
     * Si la petición coincide con un archivo físico existente en disco (scripts JS, hojas de estilo CSS, imágenes, favicon), se entrega directamente.
     * Si coincide con un directorio físico, se entrega directamente.
     * Si la URI corresponde a `/apiAmmiOnline`, se excluye de la reescritura preservando el enrutamiento independiente hacia la API ASP.NET Core.
     * Si la URI contiene una extensión de archivo inexistente, no se reescribe para permitir que IIS emita un HTTP 404 legítimo y evitar descargas corruptas de HTML interpretadas como recursos estáticos.
     * Todas las rutas del SPA de Angular son dirigidas transparentemente a `/appAmmiOnline/index.html` con estado HTTP 200, permitiendo que el enrutador del cliente gestione la navegación.

3. **Ajuste del Script de Despliegue (`deploy-ammionline.ps1`):**
   - Se introduce la lista `$NoTocarArchivosApp = @('app_offline.htm')` aplicada específicamente a la aplicación frontend.
   - La API mantiene su aislamiento estricto mediante `$NoTocarArchivos = @('appsettings*.json', 'web.config', 'app_offline.htm')`, garantizando que la configuración del backend nunca sea alterada.
   - El respaldo previo al despliegue (`Respaldo`) respalda el directorio de la app usando `$NoTocarArchivosApp`, asegurando que el `web.config` del servidor sea respaldado.
   - El procedimiento de restauración y retroceso (`Restaurar` / `-Rollback`) restaura íntegramente la aplicación incluyendo su `web.config` previo en caso de anomalía.
   - Se valida preventivamente que el artefacto desempaquetado contenga `app\web.config` antes de proceder a la sincronización en espejo (`/MIR`).

4. **Depuración del Flujo de Trabajo (`deploy.yml`):**
   - Se retira el bucle de creación estática de carpetas para `login`, `acelerado-virtual` y `formal-virtual`.
   - El empaquetado comprime directamente el resultado de compilación de Angular sin modificaciones artificiales sobre la estructura de directorios.

## Consecuencias

- **Positivas:**
  * Cobertura universal de rutas: todas las rutas presentes y futuras de Angular funcionan correctamente en recargas y accesos directos.
  * Los correos de restablecimiento de contraseña (`/reset-password?token=...`) y verificación de correo (`/verify-email-token?token=...`) funcionan sin errores 404.
  * El despliegue de la app frontend es reproducible y versionado bajo control de cambios.
  * Se mantiene la integridad y aislamiento absoluto de la API y sus secretos.
  * Se cuenta con soporte verificado de retroceso (`-Rollback`) en caso de contingencia.
