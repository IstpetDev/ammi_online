# AMMI Online

Monorepositorio de AMMI Online. El backend y el frontend comparten control de versiones, revisión y CI, pero mantienen sus proyectos y dependencias por separado.

```text
.
├── .github/                 # CI, política de ramas y Dependabot
├── docs/                    # decisiones y plan de migración
├── src/
│   ├── Backend/             # solución .NET 8 y cuatro proyectos
│   └── Frontend/            # aplicación Angular 20, npm
├── CONTRIBUTING.md
└── README.md
```

## Requisitos

- .NET SDK 8 para el backend.
- Node.js 22 y npm para el frontend.
- MySQL accesible para ejecutar la API. La compilación no necesita base de datos.

## Desarrollo local

```bash
dotnet restore src/Backend/AMMI_Online_API.sln
dotnet build src/Backend/AMMI_Online_API.sln
npm ci --legacy-peer-deps --prefix src/Frontend
npm run build --prefix src/Frontend
```

Para ejecutar el backend, configurar `ConnectionStrings__DefaultConnection`, `JwtSettings__SecretKey` y las variables de correo necesarias en el entorno local. El archivo versionado `src/Backend/src/AMMI_Online_API.API/appsettings.json` contiene esos campos vacíos. No guardar valores reales en Git. El frontend utiliza por ahora la URL local definida en `src/Frontend/src/app/environments/environment.ts`.

```bash
dotnet run --project src/Backend/src/AMMI_Online_API.API
npm start --prefix src/Frontend
```

## Ramas y CI

`develop` integra cambios desde ramas `feature/*`, `fix/*`, `docs/*`, `chore/*`, `refactor/*`, `test/*` y `ci/*`. `main` recibe releases desde `develop` y arreglos `hotfix/*`. Los PR deben tener un título `<tipo>: <resumen en minúsculas>`. El detalle está en [CONTRIBUTING.md](CONTRIBUTING.md).

El CI valida la política de ramas y escanea secretos en todos los PR. Compila y ejecuta las pruebas disponibles del backend y frontend en cada PR. En `develop` compila en Debug/desarrollo; en `main`, en Release/producción. `ci-ok` reúne los resultados. El despliegue no está configurado: se necesita definir el entorno de destino, secretos y mecanismo de reversión antes de habilitar CD.

La importación conserva Angular 20 y PrimeNG 21 tal como estaban en el frontend. `npm ci` usa temporalmente `--legacy-peer-deps` por el conflicto de dependencias entre esas versiones; hay que alinear las versiones y retirar esa opción antes de considerar el CI estable.

## Estado de la migración

El código se copió de los dos repositorios originales sin modificar su historia. Esos repositorios permanecen fuera de este Git, en `../src/AMMI_Online_FrontEnd` y `../src/Ammi_Online_Backend`. **No fusionar sus historiales sin revisar secretos**: el archivo de configuración original del backend contiene valores configurados en campos sensibles. Si son credenciales reales, hay que rotarlas. La nueva estructura usa una copia saneada.

Este directorio tiene su propio `.git` y es el punto de trabajo del monorepositorio. Las ramas `main` y `develop` se crean desde el mismo commit inicial. No publicar los dos directorios originales.

## Ajustes de GitHub

1. Crear el repositorio remoto y publicar `main` y `develop` desde el mismo commit.
2. Configurar rulesets: PR obligatorio en ambas ramas, `ci-ok` requerido, sin force push ni borrado; exigir una aprobación en `main`.
3. Asignar responsables reales en `.github/CODEOWNERS` antes de exigir revisión de CODEOWNERS.
4. Revisar la primera ejecución de CI y corregir fallas preexistentes de compilación o pruebas antes de activar `ci-ok` como check requerido.

La decisión de usar un único historial nuevo y mantener los dos proyectos separados está documentada en [ADR-0001](docs/decisiones/ADR-0001-monorepositorio-y-ramas.md).
