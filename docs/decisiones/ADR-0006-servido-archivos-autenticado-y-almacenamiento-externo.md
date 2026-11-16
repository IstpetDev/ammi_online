# ADR-0006: Servido de archivos subidos exclusivamente mediante endpoints autenticados y almacenamiento externo a la publicación

Fecha: 2026-10-30

Estado: Aceptado

## Contexto

El Issue #21 identificó un vector crítico de seguridad en la arquitectura de entrega de archivos en AMMI Online:
1. `Program.cs` configuraba `UseStaticFiles` mapeando la carpeta `Uploads` a la ruta pública `/Uploads`. Aunque `AdjuntosController` requería autenticación (`[Authorize]`) y verificaba permisos mediante `IAdjuntosAuthorizationService`, cualquier usuario o atacante con conocimiento o enumeración de la ruta del archivo (comprobantes de pago, títulos, cédulas, carnés de discapacidad o fotos) podía acceder a ellos de forma anónima a través de la ruta estática `/Uploads/{subcarpeta}/{archivo}`.
2. La carpeta de subidas residía dentro de `ContentRootPath` (el directorio publicado de la aplicación en IIS, por ejemplo `C:\inetpub\wwwroot\apiAmmiOnline\Uploads`), lo que implicaba riesgos de sobreescritura durante despliegues, exposición involuntaria por configuración del servidor web y mezcla de código ejecutable con contenido subido por usuarios.
3. El uso de `PhysicalFileProvider` en `Program.cs` requería que la carpeta existiese previamente al arrancar la aplicación, fallando el arranque si el directorio no había sido creado.
4. En el frontend, diversas vistas invocaban directamente la URL estática `${API_BASE_URL}/${path}` evadiendo la autenticación y las comprobaciones de permisos del controlador.

## Decisión

1. **Eliminación Total de `UseStaticFiles` sobre `/Uploads`:**
   - Se removió por completo la configuración de archivos estáticos sobre `/Uploads` en `Program.cs`.
   - La API ya no sirve ningún archivo de usuario de forma anónima o estática.
   - Al no instanciarse `PhysicalFileProvider` durante el arranque, `Program.cs` es resiliente y arranca exitosamente sin importar si el directorio físico existe o aún no ha sido creado.

2. **Descarga Exclusiva a través de la API Autenticada:**
   - Todo acceso a archivos subidos se realiza a través de `AdjuntosController`:
     * `GET /api/Adjuntos/{id}`: descarga de adjunto por su identificador numérico.
     * `GET /api/Adjuntos/by-path`: descarga de adjunto a partir de su ruta registrada en base de datos.
   - Ambos endpoints aplican estrictamente:
     * `[Authorize]`: peticiones no autenticadas (sin token JWT válido) responden con HTTP 401 Unauthorized.
     * `IAdjuntosAuthorizationService`: valida que el usuario sea el legítimo propietario del recurso (`DocumentosPersonales`, `PersonaDiscapacidad` o `Pago`) o pertenezca a un rol privilegiado (`Administrador`, `SuperAdmin`, `Personal`, `Docente`).
     * En caso de acceso ajeno no autorizado (Usuario A intentando acceder a los archivos de Usuario B), responde con HTTP 403 Forbidden.
     * Ambos endpoints garantizan las cabeceras defensivas de seguridad `X-Content-Type-Options: nosniff` y `Content-Disposition: attachment; filename="..."`.

3. **Carpeta de Almacenamiento Externa y Configurable por Entorno:**
   - Se centralizó la resolución de rutas mediante el servicio `IFileStoragePathService` (`FileStoragePathService`).
   - Se configuraron las claves `FileSettings:UploadPath` y `StorageSettings:Local:BasePath` con el valor por defecto `"../Uploads"`, ubicando los archivos fuera del directorio publicado de la API (en IIS: `C:\inetpub\wwwroot\Uploads` fuera de `C:\inetpub\wwwroot\apiAmmiOnline`).
   - El servicio admite rutas absolutas arbitrarias (ej. `D:\Storage\AMMI_Uploads`) o relativas resueltas frente a `ContentRootPath`, configurables dinámicamente mediante variables de entorno (`FileSettings__UploadPath`).
   - Los directorios destino se crean bajo demanda de forma segura al momento de guardar un archivo (`GetTargetFolderPath`), sin bloquear ni fallar el ciclo de vida de la aplicación.

4. **Compatibilidad hacia Atrás y Sin Cambios en Esquema de Base de Datos:**
   - No se alteró el esquema ni las columnas existentes en base de datos.
   - Las nuevas subidas continúan registrando la ruta relativa canónica en la tabla `Adjunto` (`Uploads/{subcarpeta}/{uniqueFileName}`).
   - El método `ResolvePhysicalPath` del servicio `IFileStoragePathService` implementa una estrategia de resolución adaptativa que busca el archivo en:
     1. La nueva carpeta de almacenamiento externa (`basePath/{subcarpeta}/{fileName}`).
     2. La carpeta externa con prefijo completo (`basePath/Uploads/{subcarpeta}/{fileName}`).
     3. La ubicación legacy en el directorio publicado (`ContentRootPath/Uploads/{subcarpeta}/{fileName}`).
   - Esto garantiza que los archivos históricos existentes continúen funcionando inmediatamente sin interrupción de servicio ni necesidad de migraciones de datos complejas.

5. **Adaptación Integral del Frontend:**
   - Se implementó `getAdjuntoByPath(path: string)` en `PostulacionService` para consultar el endpoint autenticado `/api/Adjuntos/by-path`.
   - Se actualizaron todos los componentes que previamente usaban URLs estáticas:
     * `DashboardComponent`: foto de perfil consultada vía blob autenticado.
     * `ManageApprovedComponent`: fotos de estudiantes matriculados cargadas vía blob autenticado.
     * `HistorialPagosComponent`: previsualización de comprobantes mediante blob seguro en drawer.
     * `MisPagosComponent` y `VerDetallesComponent`: descarga de comprobantes mediante blob autenticado.
     * `RequisitosListComponent` y `ViewStudentDocumentsComponent`: apertura de documentos del postulante exclusivamente a través de los métodos de descarga de la API.
     * `ContenidoMallaService`: descarga de contenidos de malla redirigida al endpoint `/api/Adjuntos/by-path`.

## Consecuencias

### Positivas
- **Seguridad Robusta:** Ningún archivo personal, comprobante financiero o documento institucional puede ser descargado sin sesión ni autorización de propiedad o rol.
- **Aislamiento de Publicación:** Los archivos residen fuera del directorio publicado de la aplicación en el servidor IIS, evitando sobreescrituras en despliegues con `robocopy` y segregando código ejecutable de datos estáticos de usuario.
- **Resiliencia Operativa:** El arranque de la aplicación no se bloquea si la carpeta de subidas no existe en un entorno recién desplegado.
- **Cero Pérdida de Archivos:** Las consultas y rutas históricas en base de datos mantienen su integridad y resolución sin interrupción de servicio.

### Consideraciones
- La descarga de imágenes y comprobantes en el frontend requiere que las peticiones se efectúen mediante `HttpClient` para adjuntar las cabeceras de autorización JWT (`Bearer`), utilizando `URL.createObjectURL(blob)` y revocando los object URLs creados al destruir las vistas para evitar fugas de memoria.
