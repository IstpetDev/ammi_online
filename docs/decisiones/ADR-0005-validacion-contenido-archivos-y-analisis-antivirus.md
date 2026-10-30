# ADR-0005: Validación de contenido real de archivos subidos y decisión sobre análisis antivirus

Fecha: 2026-10-30

Estado: Aceptado

## Contexto

El Issue #23 identificó que los mecanismos previos de carga de archivos en el sistema AMMI Online validaban únicamente la extensión declarada en el nombre del archivo y su tamaño, sin inspeccionar el contenido binario real (firmas de encabezado / magic numbers). Adicionalmente, existía una opción inerte `EnableVirusScan: false` en los archivos de configuración sin ningún motor ni servicio antivirus respaldando dicha funcionalidad, y la lógica de almacenamiento se encontraba fragmentada entre múltiples repositorios (`IAdjuntosRepository`, `DocumentosPersonalesRepository`, `FotoPerfilRepository`, `PersonaPostulacionRepository`).

Los riesgos de seguridad abordados comprenden:
1. **Suplantación de tipo MIME / Extensión:** Subida de binarios ejecutables de Windows (PE / MZ), binarios de Linux (ELF) o scripts de shell (`#!`), PHP o ASPX camuflados bajo extensiones permitidas como `.pdf`, `.png` o `.jpg`.
2. **Ataques de salto de directorio (Path Traversal):** Nombres de archivo que incorporan secuencias `../`, `..\` o rutas absolutas que intenten almacenar o sobrescribir archivos fuera del directorio seguro de subidas.
3. **Sobrescritura y ejecución arbitraria de archivos:** Riesgo al conservar el nombre original del cliente en disco.
4. **Sniffing y ejecución en el navegador al descargar:** Descarga de adjuntos sin forzar su descarga como archivo adjunto (`Content-Disposition: attachment`) ni impedir que el navegador infiera el tipo MIME (`X-Content-Type-Options: nosniff`), abriendo la puerta a ejecución de scripts o exploits XSS.
5. **Configuración engañosa (Zombie setting):** Mantenimiento de la bandera `"EnableVirusScan": false`, que genera una falsa expectativa de seguridad si un administrador la activa sin que exista software antivirus en el servidor.

## Decisión

1. **Servicio Centralizado y Único de Validación (`IFileValidationService`):**
   - Se consolidó toda la validación de archivos en `FileValidationService`, inyectado obligatoriamente en todas las capas y repositorios que procesan subidas:
     * Adjuntos generales (`IAdjuntosRepository`).
     * Documentos personales (`DocumentosPersonalesRepository`).
     * Foto de perfil (`FotoPerfilRepository`).
     * Discapacidad (`PersonaDiscapacidadHandler` -> `IAdjuntosRepository`).
     * Comprobantes de pago (`CreatePagoCreditoHandler` -> `IAdjuntosRepository`).
     * Postulaciones (`PersonaPostulacionRepository`).
     * Servicio de almacenamiento genérico (`FileStorageService`).
   - Se incorporó el método `ValidateFormFile(IFormFile file, ...)` que abre y valida el stream de forma segura, garantizando la uniformidad de validación en todos los puntos de entrada.

2. **Comprobación Estricta de Firmas Binarias (*Magic Numbers*):**
   - Se implementó la inspección obligatoria de los primeros bytes del flujo de datos contra las firmas oficiales:
     * **PDF:** `%PDF` (`0x25, 0x50, 0x44, 0x46`).
     * **PNG:** Cabecera PNG estándar (`0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A`).
     * **JPG / JPEG:** `0xFF, 0xD8, 0xFF`.
     * **DOCX / XLSX:** `PK\x03\x04` (`0x50, 0x4B, 0x03, 0x04`).
     * **DOC / XLS:** `0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1` (cabecera OLE2 Compound Document Binary).
   - Bloqueo incondicional de firmas ejecutables peligrosas sin importar la extensión declarada:
     * Ejecutables Windows PE / MZ (`0x4D, 0x5A`).
     * Binarios Linux ELF (`0x7F, 0x45, 0x4C, 0x46`).
     * Scripts Unix Shebang (`0x23, 0x21`).
   - Bloqueo de mismatches: si un archivo PDF válido se envía con extensión `.png` o viceversa, la validación falla de forma inmediata.

3. **Límites de Tamaño por Tipo de Archivo y Sanitización de Nombres:**
   - Se configuró soporte para cuotas máximas diferenciadas (`MaxFileSizeByExtension` en `FileSettings`):
     * Documentos (`.pdf`, `.doc`, `.docx`): límite estándar de 10 MB.
     * Imágenes (`.jpg`, `.jpeg`, `.png`): límite de 5 MB.
     * Restricción específica de contexto: el endpoint y repositorio de foto de perfil restringe estrictamente las extensiones a imágenes (`.jpg`, `.jpeg`, `.png`), rechazando cualquier documento o ejecutable.
   - **Sanitización contra Path Traversal:** `SanitizeFileName` elimina cualquier ruta previa (`/` o `\`), suprime todas las secuencias `..` residuales, remueve caracteres ilegales del sistema de archivos y recorta espacios en blanco.
   - **Almacenamiento Seguro en Disco:** Se mantiene el principio de generar un nombre único aleatorio mediante `Guid.NewGuid()` concatenado con la extensión saneada (`{guid}{ext}`), asegurando que el nombre enviado por el usuario nunca se utilice como nombre de archivo en el sistema de almacenamiento físico.

4. **Cabeceras de Seguridad en Descargas:**
   - En `AdjuntosController.GetById` se configuran obligatoriamente las cabeceras HTTP de respuesta:
     * `X-Content-Type-Options: nosniff`: Impide que navegadores modernos intenten detectar un tipo de contenido diferente al declarado, neutralizando ataques de ejecución o XSS camuflado.
     * `Content-Disposition: attachment; filename="..."`: Fuerza la descarga del archivo como adjunto en lugar de abrirlo inline en el navegador.
   - En `Program.cs`, el proveedor de archivos estáticos (`PhysicalFileProvider` sobre `/Uploads`) incluye el delegado `OnPrepareResponse` inyectando idénticas cabeceras `nosniff` y `attachment` para cualquier acceso a recursos.

5. **Decisión sobre Análisis Antivirus (`EnableVirusScan`):**
   - **Decisión:** Se retira la opción `"EnableVirusScan": false` de `appsettings.json`, `appsettings.example.json` y `appsettings.Development.json`.
   - **Justificación:** La opción era un parámetro inoperante y residual en la configuración, ya que no existía ni se contemplaba una infraestructura local de daemon antivirus (como ClamAV `clamd` o servicio ICAP) en el servidor IIS. Mantener opciones inactivas introduce deuda técnica y confusión operativa.
   - **Estrategia de defensa:** La seguridad de carga de archivos queda garantizada a nivel de aplicación por:
     1) Inspección binaria exhaustiva de firmas mágicas (*magic numbers*).
     2) Rechazo inmediato de cabeceras ejecutables (MZ, ELF, Shebang).
     3) Lista blanca rígida de extensiones permitidas.
     4) Límites de tamaño por categoría.
     5) Sanitización contra salto de directorios y renombrado aleatorio en disco mediante GUID.
     6) Encabezados `nosniff` y `attachment` en descarga.
   - Si en el futuro la institución decide incorporar escaneo antivirus avanzado, este se delegará a nivel de infraestructura y almacenamiento en la nube (ej. AWS GuardDuty para S3, Azure Defender for Storage o Microsoft Defender en el sistema operativo Windows Server / IIS), o bien mediante una integración dedicada vía microservicio de escaneo asíncrono.

## Consecuencias

- Prevención total de cargas de ejecutables o scripts maliciosos camuflados.
- Inmunidad contra ataques de Path Traversal y sobrescritura de archivos del servidor.
- Descarga segura de archivos con protección contra MIME-sniffing.
- Eliminación de configuraciones inactivas y documentación clara de la arquitectura de subidas.
