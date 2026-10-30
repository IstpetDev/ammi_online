# ADR-0003: política de endpoints públicos y reducción de superficie de ataque anónima

Fecha: 2026-10-30

Estado: Aceptado

## Contexto

El backend de AMMI Online contaba con múltiples controladores y métodos anotados con `[AllowAnonymous]` o carentes de atributos de autorización (`[Authorize]`), exponiendo operaciones sensibles que no requerían ser públicas:
1. `DistributivoController.GetByCicloAgrupado`: devolvía distributivos docentes completos con nombres, cédulas/documentos de identidad (`DocumentoDocente`) y cantidad de alumnos.
2. `MallaCompletaController`: exponía públicamente la creación (`Crear`), duplicación (`Duplicar`) y clonación (`ClonarParaCiclo`) de mallas y ciclos académicos completos.
3. `MatriculaController.CambiarParalelo`: permitía reasignar paralelos de matrícula de forma no autenticada.
4. `PersonaPostulacionController`: exponía endpoints internos de secretaría (`CrearPostulacionManual` y `ActualizarPostulacionContacto`).
5. Varios catálogos administrativos (`Especialidad`, `Materia`, `PeriodoLectivo`, `Regimen`, `TipoDiscapacidad`) y controladores derivados de `ControllerBase` (`EstadoMatricula`, `PlantillaEstructura`, `PlantillaEvaluacion`, `ReglasCalculo`, `TipoPlantillaEstructura`, `TipoReglaCalculo`) no exigían autenticación.

El Issue #25 exigía:
- Lista documentada de endpoints públicos con su motivo en `docs/`.
- Quitar el acceso anónimo donde no se justifique y verificar ausencia de datos personales en los públicos restantes.
- Una prueba automatizada que falle si aparece un endpoint anónimo no inventariado.
- Revisar el posible abuso y valorar caché o límite de tasa en los públicos.

## Decisión

1. **Retiro de acceso anónimo en endpoints no justificados:**
   - Se eliminó `[AllowAnonymous]` de `DistributivoController.GetByCicloAgrupado`, protegiendo los datos personales de la plana docente.
   - Se eliminó `[AllowAnonymous]` de todas las acciones de `MallaCompletaController` y de `MallaRequisitosController.GetAll`.
   - Se eliminó `[AllowAnonymous]` de `MatriculaController.CambiarParalelo`.
   - Se eliminó `[AllowAnonymous]` de `PersonaPostulacionController.CrearPostulacionManual` y `ActualizarPostulacionContacto`.
   - Se protegió `MallaController.GetById` y `MallaController.GetByCiclo`, manteniendo anónimos únicamente `GetMallaByTipoOferta` y `GetAll` para el formulario externo de aspirantes.
   - Se removió `[AllowAnonymous]` de catálogos internos (`Especialidad`, `Materia`, `PeriodoLectivo`, `Regimen`, `TipoDiscapacidad`).
   - Se protegió `RequisitosController` con `[Authorize]` a nivel de clase, permitiendo únicamente `[AllowAnonymous]` en `GetByMalla` (informativo para aspirantes).
   - Se agregó `[Authorize]` a los controladores de estructura de evaluación y reglas de cálculo derivados de `ControllerBase`.

2. **Inventario y documentación oficial:**
   - Se creó `docs/endpoints-publicos.md` documentando los 26 endpoints públicos legítimos, su justificación funcional, detalle de datos retornados y comprobación de ausencia de PII o datos internos confidenciales.
   - Se incluyó la matriz de amenazas de abuso y la valoración de límites de tasa (`RateLimiting` enlazado al Issue #24) y caché de respuestas para consultas masivas.

3. **Pruebas automáticas y salvaguardas de regresión:**
   - Se actualizó `AnonymousEndpointsPolicyTests`:
     * `EndpointPolicy_SolamenteEndpointsEnListaBlancaTienenAccesoAnonimo`: valida que ningún endpoint fuera de la lista blanca tenga acceso anónimo.
     * `EndpointPolicy_ListaBlanca_NoDebeContenerEndpointsInexistentesOProtegidos`: asegura coherencia bidireccional, impidiendo endpoints residuales en la lista blanca.
     * `EndpointPolicy_ControladoresSensibles_NoDebenTenerEndpointsAnonimos`: prueba parametrizada sobre 26 controladores sensibles garantizando que permanezcan libres de accesos anónimos.

## Consecuencias

- Reducción drástica de la superficie de ataque del backend; ninguna operación de modificación estructural o acceso a datos de docentes/alumnos puede invocarse sin un token JWT válido.
- Los formularios públicos de inscripción externa y el chatbot institucional operan con total normalidad consumiendo únicamente los endpoints justificados.
- El pipeline de CI fallará inmediatamente ante cualquier intento de incorporar nuevos endpoints con `[AllowAnonymous]` sin su debida justificación y registro en la lista blanca.
