# ADR-0001: monorepositorio y ramas

Fecha: 2026-10-20

Estado: Aceptado para la preparación local

## Contexto

AMMI Online tenía un repositorio para Angular y otro para .NET. La revisión y el CI de cambios que abarcan ambos proyectos resultaban separados. El repositorio `actualizacion_datos` aporta una estructura de referencia con `src/Backend`, `src/Frontend`, documentación y CI en la raíz.

## Decisión

Preparar un único repositorio con dos proyectos independientes: `src/Backend` (.NET 8) y `src/Frontend` (Angular 20). Usar `develop` para integración y `main` para releases, con PR obligatorio y un check agregado `ci-ok`. Mantener un historial Git nuevo para el monorepositorio; los historiales originales se conservan en sus repositorios de origen. No importarlos automáticamente porque el backend original versionó valores en campos sensibles de configuración.

El CI compila ambos proyectos y ejecuta las pruebas disponibles. No incluir CD hasta definir destino y procedimiento de reversión.

## Consecuencias

- Un PR puede cambiar backend y frontend de forma coordinada.
- Las versiones, comandos y dependencias siguen siendo propios de cada proyecto.
- El historial nuevo no atribuye los commits antiguos por archivo; consultar los repositorios originales para ese contexto.
- La protección de ramas requiere rulesets en GitHub y la configuración de responsables de revisión.
