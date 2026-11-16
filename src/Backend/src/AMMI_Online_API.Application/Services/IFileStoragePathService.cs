namespace AMMI_Online_API.Application.Services;

public interface IFileStoragePathService
{
    /// <summary>
    /// Retorna la ruta física absoluta de la carpeta base de almacenamiento (configurada por entorno y fuera de la publicación).
    /// </summary>
    string GetUploadsBasePath();

    /// <summary>
    /// Obtiene o crea de forma segura la ruta física para una subcarpeta específica dentro de la carpeta de almacenamiento.
    /// </summary>
    string GetTargetFolderPath(string subcarpeta);

    /// <summary>
    /// Resuelve la ruta física completa de un archivo almacenado a partir de la ruta relativa registrada en base de datos.
    /// Soporta tanto rutas nuevas (en la carpeta configurada) como rutas legacy (dentro del directorio publicado original),
    /// garantizando que no haya pérdida de archivos ni cambios en el esquema de base de datos.
    /// </summary>
    string ResolvePhysicalPath(string dbPath);
}
