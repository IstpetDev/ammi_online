using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMMI_Online_API.Application.Common.Messages;

public static class MensajeProvider
{
    public static string NotFound = "No se ha encontrado el recurso especificado";

    public static string GetMessage(bool result, string accion, string recurso)
    {
        if (result)
        {
            return accion.ToLower() switch
            {
                "obtenido" or "consultado" or "recuperado" => $"Se han obtenido {recurso} exitosamente.",
                "creado" or "registrado" or "insertado" => $"Se ha creado {recurso} correctamente.",
                "actualizado" or "modificado" or "editado" => $"Se ha actualizado {recurso} satisfactoriamente.",
                "eliminado" or "borrado" or "removido" => $"Se ha eliminado {recurso} correctamente.",
                "activado" => $"Se ha activado {recurso} correctamente.",
                "desactivado" => $"Se ha desactivado {recurso} correctamente.",
                _ => $"Se ha {accion} {recurso} correctamente."
            };
        }
        else
        {
            return accion.ToLower() switch
            {
                "obtenido" or "consultado" or "recuperado" => $"Error al obtener {recurso}. Verifique los parámetros de búsqueda.",
                "creado" or "registrado" or "insertado" => $"Error al crear {recurso}. Verifique los datos proporcionados.",
                "actualizado" or "modificado" or "editado" => $"Error al actualizar {recurso}. El recurso puede no existir o los datos son inválidos.",
                "eliminado" or "borrado" or "removido" => $"Error al eliminar {recurso}. El recurso puede no existir o estar en uso.",
                "activado" => $"Error al activar {recurso}. Verifique que el recurso exista.",
                "desactivado" => $"Error al desactivar {recurso}. Verifique que el recurso exista.",
                _ => $"Error al {accion} {recurso}."
            };
        }
    }

    public static string AlreadyExist(string recurso, string atributo)
    {
        return $"No se puede crear {recurso} porque {atributo} ya existe en el sistema.";
    }

    public static string ValidationError(string campo, string detalle = "")
    {
        return string.IsNullOrEmpty(detalle)
            ? $"Error de validación en el campo '{campo}'."
            : $"Error de validación en el campo '{campo}': {detalle}";
    }

    public static string NotFoundSpecific(string recurso)
    {
        return $"No se encontró {recurso} con los criterios especificados.";
    }

    public static string OperationSuccess(string operacion, string recurso)
    {
        return $"Operación '{operacion}' ejecutada exitosamente para {recurso}.";
    }

    public static string OperationFailed(string operacion, string recurso, string razon = "")
    {
        return string.IsNullOrEmpty(razon)
            ? $"La operación '{operacion}' falló para {recurso}."
            : $"La operación '{operacion}' falló para {recurso}: {razon}";
    }
}