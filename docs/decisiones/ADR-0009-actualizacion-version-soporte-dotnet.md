# ADR-0009: actualización a versión con soporte de .NET (LTS vigente .NET 10)

Fecha: 2026-10-30

Estado: Aceptado

## Contexto

El backend de la plataforma institucional AMMI Online fue construido originalmente sobre ASP.NET Core con destino `net8.0`.

De acuerdo con la directiva oficial del ciclo de vida y soporte de Microsoft (*Microsoft Support Lifecycle Policy* para .NET):
1. **.NET 8 (LTS):** Fue publicado el 14 de noviembre de 2023 con soporte a largo plazo (*Long Term Support* de 3 años). Su fin de soporte oficial (*End of Support* - EOS) está programado para el **10 de noviembre de 2026**.
2. **.NET 9 (STS):** Es una versión de soporte estándar (*Standard Term Support* con 18 meses de vida), cuyo soporte concluyó en **mayo de 2026**. Por ende, no constituye una alternativa viable para la estabilidad y seguridad a largo plazo de la institución.
3. **.NET 10 (LTS):** Es la versión con soporte extendido vigente (LTS con 3 años de soporte garantizado por Microsoft hasta **noviembre de 2028**), ofreciendo parches de seguridad periódicos, mejoras de compilación en tiempo de ejecución (JIT/Tiered Compilation), optimizaciones sustanciales en Entity Framework Core y compatibilidad a largo plazo con el ecosistema de librerías.

Operar una aplicación en producción sobre una versión de .NET sin soporte expone la plataforma a:
- Vulnerabilidades de seguridad sin parches del framework o del runtime del servidor.
- Obsolescencia e incompatibilidad con futuras actualizaciones de paquetes NuGet críticos (Entity Framework Core, autenticación JWT, conectores MySQL, MediatR, herramientas de auditoría).
- Pérdida de soporte en entornos de CI/CD modernos y proveedores en la nube.

## Decisión

1. **Versión de destino LTS (.NET 10):**
   - Se selecciona **.NET 10 (LTS)** como la versión oficial de destino del backend institucional, asegurando ciclo de vida con soporte activo y parches de seguridad de Microsoft hasta noviembre de 2028.
   - Se actualiza el archivo de configuración del SDK `src/Backend/global.json` especificando versión `10.0.100` con directiva de avance `rollForward: latestFeature`.

2. **Actualización de proyectos y paquetes NuGet (`TargetFramework net10.0`):**
   - Se actualiza `<TargetFramework>net10.0</TargetFramework>` en todos los proyectos de la solución:
     * `AMMI_Online_API.Domain`
     * `AMMI_Online_API.Application`
     * `AMMI_Online_API.Infrastructure`
     * `AMMI_Online_API.API`
     * `AMMI_Online_API.Tests`
   - Se actualizan los paquetes de infraestructura y seguridad:
     * `Microsoft.EntityFrameworkCore` y paquetes satélite (`Design`, `Proxies`, `Relational`, `Tools`, `InMemory`) a la versión `10.0.0`.
     * `Microsoft.AspNetCore.Authentication.JwtBearer` a `10.0.0`.
     * `MySqlConnector` a `2.6.2`, resolviendo la alerta de seguridad conocida (GHSA-473q-m89c-ghf8).
   - Se ajusta la configuración de metadatos en `Ammi_OnlineContext.OnModelCreating`, empleando la anotación estándar de modelo `modelBuilder.HasAnnotation("MySql:CharSet", "utf8")` para preservar compatibilidad binaria y desacoplar de métodos obsoletos de EF Core Abstractions.

3. **Automatización en CI/CD:**
   - **Flujo de Integración Continua (`.github/workflows/ci.yml`):**
     * Se renombra el job a `Backend (.NET 10)`.
     * Se actualiza la acción `actions/setup-dotnet` a `dotnet-version: 10.0.x`.
   - **Flujo de Despliegue (`.github/workflows/deploy.yml`):**
     * Se actualiza el paso de compilación y publicación a `dotnet-version: 10.0.x`.

4. **Verificación preventiva del Hosting Bundle en el Servidor IIS:**
   - Se incorpora la función `Comprobar-HostingBundle` en el script de despliegue `.github/despliegue/deploy-ammionline.ps1`.
   - Antes de descomprimir el artefacto o poner fuera de línea la API (`app_offline.htm`), el script comprueba rigurosamente mediante `dotnet --list-runtimes` y directorios del sistema que `Microsoft.AspNetCore.App 10.` se encuentre instalado en el servidor.
   - Si el Hosting Bundle de ASP.NET Core 10 no está instalado, el proceso aborta inmediatamente con un error descriptivo en ASCII, garantizando que el sitio permanezca 100% operativo en su estado anterior sin interrumpir el servicio.

5. **Estrategia de verificación, despliegue y retroceso:**
   - La suite completa de pruebas unitarias y de integración (122 pruebas que validan autenticación, autorización de adjuntos, endpoints anónimos y límites de tasa) se ejecuta bajo .NET 10 tanto localmente como en CI (`ci-ok`).
   - El despliegue a producción requiere la instalación manual previa por parte del administrador del sistema del paquete oficial:
     `dotnet-hosting-10.x.x-win.exe` (*ASP.NET Core Hosting Bundle*).
   - El mecanismo de retroceso atómico (`-Rollback`) y la prueba de humo perimetral (`prueba-humo.sh`) aseguran que si el aplicativo experimentara anomalías en el dominio público (`https://ammionline.ammi.edu.ec`), se restaura automáticamente el respaldo previo sin intervención manual.

## Consecuencias

### Positivas
- Soporte empresarial y de seguridad oficial garantizado por Microsoft hasta noviembre de 2028.
- Mitigación de alertas y vulnerabilidades conocidas en dependencias NuGet.
- Mayor rendimiento y menor consumo de memoria en la API mediante las mejoras nativas del runtime y JIT de .NET 10.
- Protección a nivel de despliegue que impide caídas por ausencia de runtime compatible en el servidor destino.

### Consideraciones operativas
- El equipo de infraestructura debe instalar el Hosting Bundle de .NET 10 en el servidor Windows Server / IIS antes de autorizar el primer pase a producción.
