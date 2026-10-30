# ADR-0002: pruebas automáticas mínimas en el backend

Fecha: 2026-10-30

Estado: Aceptado

## Contexto

El flujo de integración continua (`ci-ok`) compilaba el backend (.NET 8), pero la solución no disponía de proyectos de pruebas automáticas. Esto ofrecía pocas garantías contra regresiones antes de desplegar automáticamente a los entornos de producción o staging.

Específicamente, se requería una suite de pruebas mínimas para:
1. Inicio de sesión (correcto, incorrecto, y usuarios inactivos o bloqueados).
2. Autorización de adjuntos (denegación de acceso y eliminación a usuarios ajenos que no sean propietarios ni administradores).
3. Auditoría y control de endpoints anónimos permitidos (`[AllowAnonymous]`) frente a una lista blanca explícita.
4. Validación robusta de subida de archivos (firmas/magic numbers, extensiones, límites de tamaño y saneamiento contra path traversal).
5. Recolección de informe de cobertura en el CI sin imponer umbrales restrictivos al inicio.

## Decisión

1. **Estructura del proyecto de pruebas:**
   Se creó el proyecto xUnit `AMMI_Online_API.Tests` en `src/Backend/tests/AMMI_Online_API.Tests/`, integrado formalmente en la solución `src/Backend/AMMI_Online_API.sln` bajo la carpeta de solución `tests`.
   Utiliza .NET 8, `xUnit`, `Moq`, `coverlet.collector` y `Microsoft.EntityFrameworkCore.InMemory`.

2. **Servicios y protecciones incorporadas:**
   - **Autenticación:** `LoginCommandHandler` valida que la cuenta de usuario no pertenezca a una persona inactiva o bloqueada (`Activo == false`), devolviendo respuesta de fallo con mensaje claro.
   - **Autorización de adjuntos:** Se implementó `IAdjuntosAuthorizationService` y su clase `AdjuntosAuthorizationService`, que verifica si el usuario autenticado tiene roles privilegiados (`Administrador`, `SuperAdmin`, `Personal`, `Docente`) o si es el legítimo propietario del adjunto (mediante `DocumentosPersonales`, `PersonaDiscapacidad` o `Pago`). En caso contrario, `AdjuntosController` deniega la descarga o borrado con HTTP 403 Forbidden.
   - **Validación de archivos:** Se introdujo `IFileValidationService` / `FileValidationService`, verificando firmas de encabezado (PDF, PNG, JPG, DOCX/ZIP), detección y bloqueo de ejecutables encubiertos (`MZ`, scripts Shell) y saneamiento de nombres contra `../` o path traversal.
   - **Política de endpoints anónimos:** La prueba de arquitectura por reflexión `AnonymousEndpointsPolicyTests` extrae todos los endpoints con `[AllowAnonymous]` y exige que coincidan con la lista blanca documentada, fallando inmediatamente si un endpoint nuevo se expone de forma inadvertida.
   - **Cobertura en CI:** Se añadió el parámetro `--collect:"XPlat Code Coverage"` en el paso `Pruebas .NET` de `.github/workflows/ci.yml`.

## Consecuencias

- `ci-ok` exige que todas las pruebas pasen en cada pull request y push hacia `develop` o `main`.
- La solución cuenta con 43 pruebas automáticas unitarias y de arquitectura que garantizan la integridad de los flujos críticos.
- El informe de cobertura se emite como artefacto informativo sin bloquear construcciones tempranas.
