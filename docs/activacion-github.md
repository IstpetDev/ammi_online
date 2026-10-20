# Activación de ramas y CI en GitHub

Esta guía se aplica al repositorio `monorepo/`. El remoto previsto es `https://github.com/IstpetDev/ammi_online.git`.

## 1. Publicar la base

1. Crear un repositorio GitHub vacío, sin README ni licencia generados por GitHub.
2. Confirmar con `git remote -v` que `origin` apunta a la URL anterior.
3. Confirmar que `main` y `develop` apuntan al mismo commit: `git rev-parse main develop` debe mostrar dos hashes idénticos.
4. Publicar ambas ramas y fijar `main` como rama por defecto.

Los dos repositorios originales están fuera de este Git. No importar sus historiales: el backend original tiene valores configurados en campos sensibles de un archivo versionado.

## 2. Comprobar el primer PR

1. Abrir un PR pequeño desde `docs/verificar-ci` hacia `develop`, con título `docs: verificar el ci inicial`.
2. Comprobar que corren `Política de ramas`, `Secretos`, `Backend`, `Frontend`, `Validadores de CI` y `ci-ok`.
3. Si falla un build, atender el error antes de exigir `ci-ok` como check requerido. El frontend importado tiene Angular 20 con PrimeNG 21 y requiere `--legacy-peer-deps`; la instalación y compilación completas no pudieron ejecutarse en el entorno local sin acceso a npm.
4. Editar el título del PR a uno inválido y confirmar que `ci-ok` pasa a rojo. Restaurar el título válido y confirmar que vuelve a verde. Así se comprueba el evento `edited`.

## 3. Proteger las ramas

Configurar un ruleset para cada rama:

| Regla | `develop` | `main` |
| --- | --- | --- |
| Pull Request obligatorio | Sí | Sí |
| Check requerido | `ci-ok` | `ci-ok` |
| Bloquear force push y borrado | Sí | Sí |
| Aprobaciones | Según el equipo | Al menos una |

La política de origen de ramas vive en `.github/scripts/validar-rama.sh`. Los PR hacia `main` solo aceptan `develop` o `hotfix/*`; los PR hacia `develop` aceptan las ramas de trabajo definidas en `CONTRIBUTING.md`. GitHub debe tener activados los workflows de Actions.

Antes de exigir revisión de CODEOWNERS, reemplazar el comentario de `.github/CODEOWNERS` por usuarios o equipos reales con acceso de escritura. Revisar especialmente cambios en `.github/workflows/` y `.github/scripts/`.

## 4. Flujo posterior

- Trabajo normal: rama desde `develop`, PR hacia `develop`.
- Release: PR de `develop` hacia `main`.
- Hotfix: rama desde `main`, PR hacia `main`, seguido de PR de `main` hacia `develop`.
- Dependabot abre actualizaciones de npm, NuGet y Actions hacia `develop`.

No hay despliegue automático en este repositorio.
