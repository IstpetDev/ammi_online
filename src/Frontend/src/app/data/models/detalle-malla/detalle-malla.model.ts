/**
 * DTO de DetalleMalla - Representa una materia dentro de una malla curricular
 * Corresponde al DTO del backend en DetalleMallaDTO.cs
 */
export interface DetalleMallaDTO {
  idDetalleMalla: number;
  idMalla: number;
  idMateria: number;
  idPlantillaEvaluacion: number;
  idAreaCompetencia: number;

  // Datos enriquecidos (viene del backend con joins)
  nombreMateria: string;
  horasMateria: number;
  nombrePlantilla: string;
  nombreAreaCompetencia: string;
}

/**
 * DTO para crear un nuevo DetalleMalla
 */
export interface DetalleMallaCreateDTO {
  idMalla: number;
  idMateria: number;
  idPlantillaEvaluacion: number;
  idAreaCompetencia: number;
}

/**
 * DTO para actualizar un DetalleMalla
 */
export interface DetalleMallaUpdateDTO {
  idDetalleMalla: number;
  idMalla: number;
  idMateria: number;
  idPlantillaEvaluacion: number;
  idAreaCompetencia: number;
}

/**
 * DTO para creacion masiva de DetalleMalla
 */
export interface DetalleMallaBulkDTO {
  detalles: DetalleMallaCreateDTO[];
}

/**
 * DTO simplificado para dropdowns y seleccion
 */
export interface DetalleMallaSimpleDTO {
  idDetalleMalla: number;
  nombreMateria: string;
  horasMateria: number;
}
