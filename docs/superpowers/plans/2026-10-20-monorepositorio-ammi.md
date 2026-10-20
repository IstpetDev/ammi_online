# Monorepositorio AMMI Online Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reunir el frontend y el backend de AMMI Online bajo un repositorio Git con proyectos separados, CI y política de ramas compartidos.

**Architecture:** La raíz contiene documentación y workflows. `src/Backend` conserva la solución .NET 8 y `src/Frontend` conserva el proyecto Angular 20; los dos se compilan de manera independiente. El historial del nuevo repositorio empieza limpio debido a los valores sensibles presentes en la configuración original.

**Tech Stack:** .NET 8, Angular 20, npm, GitHub Actions, gitleaks, Bash.

---

### Task 1: Trasladar los proyectos

**Files:** `src/Backend/AMMI_Online_API.sln`, `src/Backend/src/`, `src/Frontend/package.json`, `src/Frontend/package-lock.json`, `src/Frontend/src/`.

- [x] Copiar únicamente archivos versionados desde `AMMI_Online_API/` y `Ammi_Online/`, sin los directorios `.git` internos.
- [x] Conservar las rutas internas de la solución .NET y de Angular.
- [x] Comparar los archivos trasladados con los originales por contenido, excepto la configuración saneada.

### Task 2: Saneamiento de configuración

**Files:** `src/Backend/src/AMMI_Online_API.API/appsettings.json`, `.gitignore`, `README.md`.

- [x] Vaciar en la copia del backend la cadena de conexión, la clave JWT y los valores de correo.
- [x] Excluir del futuro Git los dos repositorios originales, las dependencias descargadas y la configuración local.
- [x] Documentar las variables de entorno para ejecutar la API.

### Task 3: Política de ramas y CI

**Files:** `.github/workflows/ci.yml`, `.github/workflows/branch-policy.yml`, `.github/workflows/secrets-scan.yml`, `.github/scripts/validar-rama.sh`, `.github/dependabot.yml`, `CONTRIBUTING.md`.

- [x] Validar las rutas `main`, `develop`, `hotfix/*` y las ramas de trabajo con el script de la referencia.
- [x] Ejecutar escaneo de secretos, build y pruebas disponibles para ambos proyectos en PR.
- [x] Usar Debug/desarrollo para PR a `develop` y Release/producción para PR a `main`.
- [x] Reunir los resultados en `ci-ok` y programar actualizaciones de dependencias hacia `develop`.
- [ ] Confirmar la primera ejecución real en GitHub y corregir fallas del código importado que impidan un CI verde.

### Task 4: Activar el repositorio Git único

**Files:** `.git`, `.github/CODEOWNERS`.

- [x] Mover el contenido preparado a `monorepo/`, sin incluir `src/AMMI_Online_FrontEnd` ni `src/Ammi_Online_Backend`.
- [x] Ejecutar `git init -b main` y revisar `git status --short` antes del primer commit.
- [ ] Crear `develop` desde el mismo commit inicial de `main`.
- [ ] Definir los responsables reales en `.github/CODEOWNERS` y configurar rulesets para requerir PR y `ci-ok`.

El `.git` del directorio padre está montado en solo lectura; `monorepo/.git` es escribible y contiene el repositorio nuevo.
