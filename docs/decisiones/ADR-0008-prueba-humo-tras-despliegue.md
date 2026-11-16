# ADR-0008: prueba de humo en dominio público tras despliegue

Fecha: 2026-10-30

Estado: Aceptado

## Contexto

El flujo de despliegue a producción (`.github/workflows/deploy.yml`) ejecutaba validaciones de salud exclusivamente a nivel interno en el servidor mediante `http://localhost/appAmmiOnline/` y `http://localhost/apiAmmiOnline/` dentro del script `deploy-ammionline.ps1`.

Sin embargo, una comprobación en `localhost` no garantiza que el usuario final pueda consumir la plataforma a través del dominio público (`https://ammionline.ammi.edu.ec`):
1. No valida la capa perimetral (proxy inverso Nginx, certificados SSL/TLS, encabezados de reenvío y reglas de enrutamiento).
2. No verifica que las rutas públicas del SPA de Angular (`/login`, `/acelerado-virtual`, `/formal-virtual`, `/forgot-password`, `/reset-password`, `/verify-email-token`) resuelvan correctamente con HTTP 200 sin sufrir errores 404 o bucles de redirección.
3. No comprueba que los recursos estáticos compilados con hash (`main-*.js`) sean accesibles públicamente con HTTP 200.
4. No comprueba que el backend ASP.NET Core responda en su ruta pública y aplique las restricciones de método HTTP esperadas (como responder 405 Method Not Allowed ante una petición GET a un endpoint exclusivo de POST como `/api/Auth/login`).
5. En caso de fallas perimetrales o de enrutamiento, el job de despliegue finalizaba en verde a pesar de que el sitio era inaccesible para los usuarios.

## Decisión

1. **Script de prueba de humo automatizado (`.github/scripts/prueba-humo.sh`):**
   - Se implementó un script en Bash que consulta el dominio público (por defecto `https://ammionline.ammi.edu.ec` o configurable mediante `SMOKE_TEST_URL`).
   - Valida metódicamente:
     * **Página principal:** `GET /` -> HTTP 200.
     * **Rutas públicas SPA:** `GET /login`, `GET /acelerado-virtual`, `GET /formal-virtual`, `GET /forgot-password`, `GET /reset-password`, `GET /verify-email-token` -> HTTP 200.
     * **Endpoint API protegido/restringido:** `GET /apiAmmiOnline/api/Auth/login` -> HTTP 405 Method Not Allowed (garantizando que la API esté viva y active su pipeline de enrutamiento).
     * **Recurso estático compilado:** Extrae dinámicamente el nombre del script principal (`main-*.js`) desde el HTML y verifica que responda HTTP 200.
   - Cuenta con tolerancia y reintentos configurables (3 intentos con intervalo de 5 s) para absorber tiempos de reciclaje del Application Pool o actualización de caché en el proxy.

2. **Privacidad estricta en logs públicos:**
   - Siguiendo los criterios de seguridad del proyecto, `prueba-humo.sh` utiliza `curl -s -L -o /dev/null -w '%{http_code}'`, descartando los cuerpos de respuesta.
   - Nunca imprime HTML, encabezados internos, cadenas de conexión ni trazas de error del servidor en la consola de GitHub Actions, preservando la confidencialidad de la infraestructura.

3. **Resumen en `$GITHUB_STEP_SUMMARY`:**
   - Emite una tabla en Markdown documentando cada ruta consultada, método HTTP, código esperado, código obtenido y estado final (✅ OK / ❌ FALLO).
   - En caso de error, destaca mediante alertas `> [!CAUTION]` la lista explícita de rutas que fallaron.

4. **Integración en el flujo de despliegue (`deploy.yml`):**
   - Se añadió el paso `Prueba de humo en dominio público` tras la ejecución del script de despliegue.
   - Se actualizó el checkout de despliegue para incluir `.github/scripts`.
   - **Retroceso automático:** Si la prueba de humo falla, el job activa inmediatamente el paso condicional `Retroceso automático y alerta` (`if: failure() && steps.smoke_test.outcome == 'failure'`), ejecutando por SSH la restauración del último respaldo (`deploy-ammionline.ps1 -Rollback <id>`) antes de borrar las credenciales temporales.
   - **Notificación al equipo:** Si se configura el secreto opcional `ALERTA_DESPLIEGUE_WEBHOOK`, envía un mensaje de alerta inmediata al canal del equipo notificando el fallo y la ejecución del retroceso.
   - El job finaliza en estado rojo (`failure`), alertando al equipo y bloqueando el pipeline.

5. **Suite de pruebas unitarias (`.github/scripts/pruebas/prueba-humo.test.sh`):**
   - Se incorporó una suite de pruebas que simula respuestas de `curl` cubriendo escenarios exitosos, rutas caídas (404), fallos en API (código distinto de 405), ausencia de `main-*.js` y validación de no filtración de datos en logs.
   - Se integró en el job `validadores` de `ci.yml`.

## Consecuencias

- Los despliegues a producción garantizan la disponibilidad real de la aplicación de cara al usuario final antes de darse por completados.
- Ante fallas en producción, el sistema se recupera automáticamente restituyendo el último estado funcional conocido sin requerir intervención manual urgente.
- Se previene la fuga de datos sensibles en los logs públicos de Actions.
- La suite de CI valida preventivamente la integridad del script de prueba de humo en cada PR hacia `develop` o `main`.
