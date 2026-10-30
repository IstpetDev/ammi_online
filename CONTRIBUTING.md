# Guía de contribución

## Ramas

| Destino | Origen permitido | Propósito |
| --- | --- | --- |
| `develop` | `feature/*`, `fix/*`, `docs/*`, `chore/*`, `refactor/*`, `test/*`, `ci/*` | Integración habitual |
| `develop` | `main` | Devolver un hotfix fusionado en `main` |
| `develop` | `dependabot/*` creado por `dependabot[bot]` | Actualizar dependencias |
| `main` | `develop`, `hotfix/*` | Release o corrección urgente |

Crear ramas de trabajo desde `develop`. Usar nombres en minúsculas y con guiones, por ejemplo `feature/registro-estudiantes` o `fix/123-validar-fecha`. Para un hotfix, partir de `main`, abrir PR a `main` y después otro PR de `main` a `develop`.

Nadie hace push directo a `main` o `develop`. No usar force push en esas ramas. Los rulesets del repositorio remoto son necesarios para imponer esta regla; el workflow solo valida los PR.

## Commits y PR

Usar commits pequeños en español. El título del PR lleva el formato `<tipo>: <resumen en minúsculas>` con los tipos `feat`, `fix`, `docs`, `chore`, `refactor`, `test` o `ci`. Ejemplo: `fix: validar la fecha de matrícula`. La política automatizada exige un solo espacio después de `:` y no admite ámbitos como `feat(api):`.

Describir qué cambió, por qué y cómo se probó. Adjuntar capturas cuando se modifique la interfaz, sin datos personales reales.

## Comprobaciones locales

```bash
dotnet restore src/Backend/AMMI_Online_API.sln
dotnet build src/Backend/AMMI_Online_API.sln
dotnet test src/Backend/AMMI_Online_API.sln
npm ci --legacy-peer-deps --prefix src/Frontend
npm run build --prefix src/Frontend
npm test --prefix src/Frontend -- --watch=false --browsers=ChromeHeadless
bash .github/scripts/pruebas/validar-rama.test.sh
```

El backend cuenta con una suite de pruebas automatizadas (xUnit) en `src/Backend/tests/AMMI_Online_API.Tests` que cubre autenticación, autorización de adjuntos, endpoints anónimos permitidos y validación de archivos; `dotnet test` genera informe de cobertura y es exigido por `ci-ok`. La aplicación Angular tiene una prueba inicial que debe mantenerse alineada con la interfaz real.

## Seguridad y configuración

No incluir credenciales, datos personales reales, cadenas de conexión ni tokens en código, pruebas, archivos de ejemplo o capturas. Configurar los valores locales mediante variables de entorno. El frontend se distribuye al navegador, por lo que su configuración no puede contener secretos.

Si una credencial ya entró en un historial Git, avisar al responsable y rotarla. Borrar el archivo en un commit posterior no elimina la exposición anterior.

## Revisión y publicación

Esperar a que `ci-ok` termine en verde y a la revisión correspondiente. Los PR hacia `main` representan un release completo o un hotfix. No hay despliegue automático en esta etapa.
