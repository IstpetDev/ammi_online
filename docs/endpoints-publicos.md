# Endpoints Públicos y Política de Acceso Anónimo

Este documento define la política oficial de seguridad, el inventario exhaustivo de endpoints con acceso anónimo (`[AllowAnonymous]`) y las medidas técnicas de protección frente a abusos y consultas masivas en la API de AMMI Online (`AMMI_Online_API.API`).

---

## 1. Principio de Mínimo Privilegio

Todo endpoint en la API debe requerir autenticación (`[Authorize]`) por defecto, a excepción exclusiva de los flujos públicos indispensables:
1. **Autenticación e inicio de sesión.**
2. **Verificación de correo mediante tokens u OTP** (necesaria durante el registro o postulación).
3. **Formulario público de postulación externa** para nuevos aspirantes.
4. **Catálogos básicos de referencia** requeridos para completar los campos del formulario de postulación.
5. **Asistente virtual (ChatBot)** para brindar información académica institucional a usuarios no autenticados.

Cualquier operación que cree, modifique, elimine o consulte datos administrativos, académicos internos, notas, pagos, distributivos docentes o registros de auditoría **debe exigir autenticación obligatoria**.

---

## 2. Inventario de Endpoints Públicos Permitidos

A continuación se detalla cada endpoint que cuenta con autorización anónima explícita, junto con su justificación funcional y la verificación de ausencia de datos personales (PII) o confidenciales en su respuesta.

| # | Controlador y Acción | Verbo | Ruta | Justificación / Propósito | Datos Retornados | PII o Datos Internos |
|---|----------------------|-------|------|---------------------------|------------------|----------------------|
| 1 | `AuthController.Login` | POST | `/api/Auth/Login` | Permitir el acceso al sistema mediante credenciales. | Token JWT, información básica del usuario autenticado (id, username, roles). | ❌ No expone contraseñas ni hashes; genera token firmado. |
| 2 | `AuthController.Register` | POST | `/api/Auth/Register` | Registro inicial de usuarios en la plataforma. | Objeto de confirmación con identificador del usuario creado. | ❌ No expone datos ajenos. |
| 3 | `EmailVerificationController.SendOtp` | POST | `/api/EmailVerification/send-otp` | Envío de código OTP temporal de 6 dígitos al correo del aspirante. | Mensaje de éxito/fallo (`Response<bool>`). | ❌ No expone el código OTP en la respuesta; se despacha por canal SMTP seguro. |
| 4 | `EmailVerificationController.VerifyEmailToken` | GET | `/api/EmailVerification/verify-email-token` | Confirmación de correo mediante enlace con token unívoco. | Mensaje de resultado de validación. | ❌ Sin datos personales; únicamente estado de éxito/error. |
| 5 | `EmailVerificationController.VerifyOtp` | POST | `/api/EmailVerification/verify-otp` | Validación del código OTP ingresado por el aspirante en el formulario. | Resultado booleano de la validación. | ❌ Sin PII. |
| 6 | `EmailVerificationController.ResendOtp` | POST | `/api/EmailVerification/resend-otp` | Reenvío de código OTP ante expiración. | Mensaje de confirmación de envío. | ❌ Sin PII ni exposición del token. |
| 7 | `EmailVerificationController.CheckEmailVerified` | GET | `/api/EmailVerification/check-email-verified` | Consulta si el correo proporcionado ya fue validado para habilitar el botón de envío. | Estado de validación booleano. | ❌ Solo devuelve `{ isVerified: bool }`. |
| 8 | `ChatBotController.GetInformacionActiva` | GET | `/api/ChatBot/informacion-activa` | Proporcionar información pública institucional al asistente virtual sobre ofertas, ciclos activos, mallas, costos y requisitos. | `ChatBotCicloDTO`: tipo de oferta, nombre de ciclo, detalle de mallas, costos referenciales de matrícula/pensión y nombres de requisitos. | ❌ No expone docentes, alumnos, notas ni cuentas bancarias internas. |
| 9 | `CantonController.GetAllCanton` | GET | `/api/Canton/GetAllCanton` | Llenado del selector desplegable de cantones en el formulario de residencia y nacimiento. | Lista de `{ idCanton, nombreCanton, idProvincia }`. | ❌ Solo división geográfica pública. |
| 10 | `CicloController.GetCiclo` | GET | `/api/Ciclo/GetCiclo` | Mostrar ciclos académicos disponibles para la inscripción. | Lista de `{ idCiclo, detalle, esActivo, ... }`. | ❌ Metadatos de ciclos académicos públicos. |
| 11 | `CursosController.GetCursos` | GET | `/api/Cursos/GetCursos` | Mostrar los cursos/niveles académicos (ej. 1ro, 2do, 3ro BGU) al aspirante. | Lista de `{ idCursos, nombreCurso, ... }`. | ❌ Nomenclatura pública de niveles educativos. |
| 12 | `EstadoCivilController.GetAllEstadoCivil` | GET | `/api/EstadoCivil/GetAllEstadoCivil` | Selector de estado civil en datos personales de la postulación. | Lista de `{ idEstadoCivil, descripcion }`. | ❌ Catálogo estático estándar. |
| 13 | `EtniaController.GetAllEtnias` | GET | `/api/Etnia/GetAllEtnias` | Selector de autoidentificación étnica en la postulación. | Lista de `{ idEtnia, nombreEtnia }`. | ❌ Catálogo estático estándar. |
| 14 | `GeneroController.GetAllGenero` | GET | `/api/Genero/GetAllGenero` | Selector de género en la postulación. | Lista de `{ idGenero, descripcion }`. | ❌ Catálogo estático estándar. |
| 15 | `NacionalidadEtnicaController.GetAllNacionalidadEtnica` | GET | `/api/NacionalidadEtnica/GetAllNacionalidadEtnica` | Selector de nacionalidad o pueblo indígena en la postulación. | Lista de `{ idNacionalidadEtnica, descripcion }`. | ❌ Catálogo estático estándar. |
| 16 | `PaisController.GetAllPais` | GET | `/api/Pais/GetAllPais` | Selector de país de origen o residencia en la postulación. | Lista de `{ idPais, nombrePais, nacionalidad, ... }`. | ❌ Catálogo geográfico público. |
| 17 | `ParroquiaController.GetAllParroquia` | GET | `/api/Parroquia/GetAllParroquia` | Selector de parroquia según el cantón seleccionado en la postulación. | Lista de `{ idParroquia, nombreParroquia, idCanton }`. | ❌ Catálogo geográfico público. |
| 18 | `ProvinciaController.GetAllProvincia` | GET | `/api/Provincia/GetAllProvincia` | Selector de provincias en el formulario de inscripción. | Lista de `{ idProvincia, nombreProvincia, idPais }`. | ❌ Catálogo geográfico público. |
| 19 | `ProvinciaController.GetProvinciasByPais` | GET | `/api/Provincia/GetProvinciasByPais/{idPais}` | Filtrar provincias por el país seleccionado. | Lista de `{ idProvincia, nombreProvincia, idPais }`. | ❌ Catálogo geográfico público. |
| 20 | `RequisitosController.GetByMalla` | GET | `/api/Requisitos/GetRequisitosByMalla/{idMalla}` | Mostrar al aspirante los documentos que debe consignar según la malla seleccionada. | Lista de `{ idRequisitos, nombre, descripcion, esObligatorio }`. | ❌ Requisitos documentales informativos. |
| 21 | `TipoDatoContactoController.GetAllTipoDatoContacto` | GET | `/api/TipoDatoContacto/GetAllTipoDatoContacto` | Selector de tipos de contacto (teléfono móvil, teléfono fijo, etc.). | Lista de `{ idTipoDatoContacto, descripcion }`. | ❌ Catálogo estático de etiquetas. |
| 22 | `TipoDocumentoController.GetAllTipoDocumento` | GET | `/api/TipoDocumento/GetAllTipoDocumento` | Selector del tipo de documento de identidad (Cédula, Pasaporte). | Lista de `{ idTipoDocumento, nombre, ... }`. | ❌ Catálogo estático de tipos de identificación. |
| 23 | `TipoOfertaController.GetAllTipoOferta` | GET | `/api/TipoOferta/GetAllTipoOferta` | Mostrar las modalidades de oferta educativa (Formal Virtual, Acelerado Virtual). | Lista de `{ idTipoOferta, nombreTipoOferta, ... }`. | ❌ Catálogo público institucional. |
| 24 | `MallaController.GetAll` | GET | `/api/Malla` | Consulta de mallas académicas para carga de cursos en navegación libre. | Lista paginada de `MallaDTO` (`idMalla`, `detalle`, `nombreCurso`, `nombreTipoOferta`). | ❌ Estructura curricular sin datos personales ni distributivos. |
| 25 | `MallaController.GetMallaByTipoOferta` | GET | `/api/Malla/GetMallaByTipoOferta/{idTipoOferta}` | Cargar cursos activos para la modalidad elegida por el aspirante en la landing page. | Colección de `MallaDTO`. | ❌ Solo datos de cursos y ciclo activo. |
| 26 | `PersonaPostulacion.CrearPostulacion` | POST | `/api/PersonaPostulacion/create-postulacion` | Recepción del formulario de inscripción externa diligenciado por el aspirante. | Identificador numérico (`Response<int>`) de la postulación creada. | ❌ Solo retorna el id de confirmación del trámite; no expone postulaciones previas. |

---

## 3. Endpoints Desanonimizados y Protegidos

Los siguientes endpoints disponían previamente de `[AllowAnonymous]` o carecían de atributo de autorización. Tras la revisión de seguridad, fueron **estrictamente protegidos bajo autenticación** (`[Authorize]`):

1. **`DistributivoController.GetByCicloAgrupado` (`/api/Distributivo/ByCiclo/{idCiclo}/Agrupado`):**
   - **Riesgo previo:** Devolvía `ParaleloConDistributivosDTO` que incluía nombres completos de docentes, cédulas/documentos de identidad (`DocumentoDocente`), conteo de estudiantes y fechas de registro de calificaciones.
   - **Medida adoptada:** Eliminado `[AllowAnonymous]`. Requiere autenticación de personal administrativo o docente.

2. **`MallaCompletaController` (`Crear`, `Duplicar`, `ClonarParaCiclo`, `configuracion-cursos`):**
   - **Riesgo previo:** Permitía la creación, duplicación y clonación masiva de estructuras curriculares completas de manera anónima.
   - **Medida adoptada:** Eliminado `[AllowAnonymous]` en todas sus acciones. Son operaciones administrativas exclusivas de gestión académica.

3. **`MallaRequisitosController.GetAll`:**
   - **Riesgo previo:** Exposición de todas las asociaciones de requisitos del sistema.
   - **Medida adoptada:** Eliminado `[AllowAnonymous]`. Mantenido bajo el `[Authorize]` a nivel de controlador.

4. **`MallaController.GetById` y `MallaController.GetByCiclo`:**
   - **Riesgo previo:** Acceso anónimo innecesario; el portal público solo requiere filtrar por tipo de oferta activa (`GetMallaByTipoOferta`).
   - **Medida adoptada:** Eliminado `[AllowAnonymous]`.

5. **`MatriculaController.CambiarParalelo`:**
   - **Riesgo previo:** Un atacante no autenticado podía reasignar el paralelo de cualquier alumno matriculado mediante un PUT arbitrario.
   - **Medida adoptada:** Eliminado `[AllowAnonymous]`.

6. **`PersonaPostulacionController.CrearPostulacionManual` y `ActualizarPostulacionContacto`:**
   - **Riesgo previo:** Endpoints creados para uso de secretaría en ventanilla estaban expuestos al público.
   - **Medida adoptada:** Eliminado `[AllowAnonymous]`. Protegidos bajo el `[Authorize]` heredado de `ApiController`.

7. **Catálogos exclusivamente administrativos:**
   - `EspecialidadController.GetEspecialidad`: Eliminado `[AllowAnonymous]`.
   - `MateriaController.GetMaterias`: Eliminado `[AllowAnonymous]`.
   - `PeriodoLectivoController.GetPeriodosLectivos`: Eliminado `[AllowAnonymous]`.
   - `RegimenController.GetRegimenes`: Eliminado `[AllowAnonymous]`.
   - `TipoDiscapacidadController.GetAllTipoDiscapacidad`: Eliminado `[AllowAnonymous]`.

8. **Controladores con `ControllerBase` sin filtro de autorización:**
   - `EstadoMatriculaController`, `PlantillaEstructuraController`, `PlantillaEvaluacionController`, `ReglasCalculoController`, `TipoPlantillaEstructuraController` y `TipoReglaCalculoController` fueron blindados agregando explícitamente `[Authorize]` a nivel de clase.
   - `RequisitosController`: Se incorporó `[Authorize]` a nivel de clase para proteger `GetAll`, `Create`, `Update` y `Delete`, dejando únicamente `GetByMalla` como `[AllowAnonymous]`.

---

## 4. Análisis de Amenazas y Valoración de Mitigaciones

### 4.1. Vectores de Abuso en Endpoints Públicos

| Vector de Riesgo | Endpoints Expuestos | Impacto Potencial | Estrategia de Mitigación |
|---|---|---|---|
| **Agotamiento de cuota de correo / Spam de OTP** | `/api/EmailVerification/send-otp`, `/api/EmailVerification/resend-otp` | Sobrecarga del servidor SMTP, costos por consumo de emails, saturación de buzones de víctimas (email bombing). | **Límite de tasa por IP y por correo de destino:** Máximo 3 solicitudes de OTP por correo cada 10 minutos (cubierto en Issue #24). |
| **Fuerza bruta contra credenciales** | `/api/Auth/Login` | Compromiso de cuentas de usuario por adivinación de contraseñas. | **Límite de intentos y bloqueo temporal:** Máximo 5 intentos fallidos consecutivos por IP y por usuario (cubierto en Issue #24). |
| **Inyección masiva de postulaciones falsas** | `/api/PersonaPostulacion/create-postulacion` | Contaminación de la base de datos con postulaciones basura, denegación de servicio por llenado de almacenamiento. | **Límite de tasa (Fixed Window):** Máximo 5 envíos por IP cada hora, validación de OTP previo y validación de unicidad de cédula/identificación. |
| **Consultas masivas y scraping de catálogos** | `/api/Canton/*`, `/api/Provincia/*`, `/api/Pais/*`, `/api/Genero/*`, etc. | Consumo excesivo de conexiones a la base de datos MySQL/SQL Server por bots o indexadores. | **Caché HTTP y en memoria:** Encabezados `Cache-Control: public, max-age=3600` o caché en memoria (IMemoryCache). Los catálogos son cuasi-estáticos. |

### 4.2. Valoración de Caché en Catálogos Públicos

Los catálogos geográficos (`Pais`, `Provincia`, `Canton`, `Parroquia`) y biográficos (`Genero`, `EstadoCivil`, `Etnia`, `TipoDocumento`, `TipoDatoContacto`) rara vez cambian (frecuencia mensual o anual).
- **Recomendación técnica:** Configurar en middleware o controladores `ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)` o el servicio `IMemoryCache` de ASP.NET Core para que consultas repetitivas de aspirantes o navegadores no ejecuten queries SQL repetitivas.
- Para la consulta de ofertas (`ChatBot/informacion-activa` y `Malla/GetMallaByTipoOferta`), una vigencia de caché corta (ej. 300 a 900 segundos) previene picos de tráfico masivo en temporadas altas de inscripción (campañas publicitarias en redes sociales).

### 4.3. Vinculación con Issue #24 (Límite de Tasa)

El middleware oficial `Microsoft.AspNetCore.RateLimiting` (.NET 8) debe ser activado para aplicar políticas específicas:
- `fixed-login`: Límite estricto sobre `AuthController.Login` y endpoints OTP.
- `sliding-public-catalog`: Límite amplio (ej. 120 peticiones/minuto por cliente IP) sobre los catálogos públicos para permitir la navegación fluida de aspirantes y bloquear scrapers agresivos.

---

## 5. Garantía Automatizada contra Regresiones

Para impedir que futuros desarrollos expongan endpoints anónimos sin justificación, la suite de pruebas del backend incluye la prueba de arquitectura por reflexión:
- **`AnonymousEndpointsPolicyTests.EndpointPolicy_SolamenteEndpointsEnListaBlancaTienenAccesoAnonimo`:**
  Inspecciona todas las clases y acciones derivadas de `ControllerBase`. Si cualquier método o clase posee `[AllowAnonymous]` o carece de `[Authorize]` y no figura en `WhitelistedAnonymousEndpoints`, la prueba falla de forma inmediata en la compilación y en el pipeline de CI (`ci-ok`).
- **`AnonymousEndpointsPolicyTests.EndpointPolicy_ListaBlanca_NoDebeContenerEndpointsInexistentesOProtegidos`:**
  Verifica que la lista blanca no contenga registros obsoletos de endpoints que ya hayan sido protegidos.
- **`AnonymousEndpointsPolicyTests.EndpointPolicy_ControladoresSensibles_NoDebenTenerEndpointsAnonimos`:**
  Verifica explícitamente que los controladores de negocio sensible (usuarios, roles, pagos, adjuntos, notas, créditos, distributivos, mallas completas, etc.) permanezcan totalmente herméticos.
