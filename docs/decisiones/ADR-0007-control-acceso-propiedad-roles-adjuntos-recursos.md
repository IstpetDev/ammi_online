# ADR-0007: Comprobación de propietario y rol al descargar o borrar adjuntos y recursos de persona

Fecha: 2026-10-30

Estado: Aceptado

## Contexto

El Issue #22 identificó que los endpoints de descarga y eliminación (`GET` y `DELETE`) en `AdjuntosController` requerían autenticación (`[Authorize]`) pero carecían de comprobaciones de autorización a nivel de registro (IDOR / BOLA):
1. Los identificadores de adjuntos y recursos de personas son enteros autoincrementales predecibles.
2. Un usuario autenticado con rol de estudiante podía intentar descargar o eliminar archivos adjuntos pertenecientes a otros estudiantes simplemente modificando el identificador numérico en la petición.
3. No existía una restricción que impidiese que un estudiante eliminara adjuntos vinculados a documentos ya aprobados institucionalmente o a comprobantes de pago registrados.
4. Los endpoints no protegían contra la enumeración de recursos (diferenciación entre archivo inexistente y archivo ajeno), exponiendo potencialmente la existencia de registros.
5. Otros controladores (`DocumentosPersonalesController`, `FotoPerfilController`, `PersonaDiscapacidadController` y `PagosController`) recibían identificadores de recursos personales sin verificar de forma homogénea si el recurso pertenecía al usuario autenticado o si este contaba con un rol administrativo autorizado.

## Decisión

1. **Centralización del Control de Acceso en `IAdjuntosAuthorizationService`:**
   - Se extendió `IAdjuntosAuthorizationService` e implementó en `AdjuntosAuthorizationService` la lógica de comprobación de propiedad y roles diferenciados:
     * **Roles de Lectura (`RolesLectura`):** `Administrador`, `SuperAdmin`, `Personal`, `Docente`. Autorizados a consultar y descargar adjuntos de alumnos.
     * **Roles de Eliminación y Modificación Administrativa (`RolesEliminacion`):** `Administrador`, `SuperAdmin`, `Personal`. El rol `Docente` queda expresamente excluido de la eliminación de adjuntos y registros de estudiantes.
     * **Roles de Gestión Financiera (`RolesPagos`):** `Administrador`, `SuperAdmin`, `Personal`, `Docente`, `MASTER-CONTABILIDAD`, `SECRETARIA-GENERAL`.

2. **Restricción de Borrado (`DELETE /api/Adjuntos/{id}`):**
   - El endpoint `DELETE /api/Adjuntos/{id:int}` valida `PuedeEliminarAdjuntoAsync`.
   - Si el usuario no tiene rol administrativo, solo puede eliminar el adjunto si es el legítimo propietario **y** puede modificar el registro asociado:
     * `DocumentosPersonales`: Solo permitido si `IdPersona` coincide con el usuario autenticado **y** el documento no ha sido aprobado institucionalmente (`Estado != true`). Si ya está aprobado, la eliminación queda bloqueada para el estudiante.
     * `PersonaDiscapacidad`: Solo permitido si `IdPersona` coincide con el usuario autenticado.
     * `Pago`: Los comprobantes de pago no pueden ser borrados directamente por estudiantes para evitar inconsistencias contables y fraude.
     * `Institucion` o adjuntos de catálogo: Solo modificables por roles administrativos.
   - Si no está autorizado, responde estrictamente con HTTP 403 Forbidden.

3. **Prevención de Enumeración y Fuga de Existencia:**
   - En peticiones sin privilegios administrativos, cualquier solicitud sobre un identificador ajeno o inexistente devuelve de manera homogénea HTTP 403 Forbidden.
   - Cuando un rol autorizado o el propietario solicita un recurso que no existe, se responde con HTTP 404 Not Found con mensaje genérico ("Archivo no encontrado."), evitando filtrar rutas físicas del sistema de archivos o detalles de base de datos.

4. **Blindaje de Controladores de Recursos Personales:**
   - Se añadieron propiedades de conveniencia en `ApiController` (`CurrentPersonaId`, `CurrentRoles`, `AdjuntosAuthService`) para estandarizar las comprobaciones en toda la API.
   - **`FotoPerfilController`:**
     * `UpdateFoto` y `DeleteFoto` validan `PuedeModificarFotoPerfilAsync` y `PuedeEliminarFotoPerfilAsync` (propietario y no aprobado, o rol administrativo).
     * `DeleteFotoAdminByDocumento` y `DeleteFotoAdminByPersonaId` quedan restringidos con `[Authorize(Roles = "Administrador,SuperAdmin,Personal")]`.
   - **`DocumentosPersonalesController`:**
     * `UpdateDocumentosPersonales` y `DeleteDocumentosPersonales` validan propiedad y estado pendiente/rechazado (`Estado != true`).
   - **`PersonaDiscapacidadController`:**
     * `UpdatePersonaDiscapacidad` y `DeletePersonaDiscapacidad` validan propiedad sobre el registro de discapacidad.
   - **`PagosController`:**
     * `GetPagosByDocumento`: Estudiantes solo pueden consultar pagos asociados a su propio documento de identidad. Roles financieros/administrativos acceden a cualquier documento.
     * `GetPagosByMatricula`: Estudiantes solo pueden consultar pagos asociados a sus propias matrículas.

## Consecuencias

### Positivas
- **Mitigación Completa de IDOR/BOLA:** Un usuario autenticado no puede acceder, alterar ni eliminar adjuntos ni registros de otra persona.
- **Integridad de Datos Aprobados:** Los estudiantes no pueden eliminar requisitos, documentos personales ni fotos una vez aprobados por secretaría o administración.
- **Protección Antifraude Contable:** Los comprobantes de pago registrados quedan protegidos contra borrado arbitrario por parte de estudiantes.
- **Prevención de Enumeración:** Los atacantes no pueden deducir si un identificador existe o no mediante sondeo de respuestas.
- **Cobertura de Pruebas:** Suite integral de pruebas unitarias automatizadas en `AMMI_Online_API.Tests.Adjuntos.AdjuntosAuthorizationTests` que valida accesos propios, denegación a ajenos, bloqueo sobre registros aprobados y comprobación de roles.
