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
  modulo: number;
  fechaInicio: string;
  fechaFin: string;
  duracionHoras: number;
  diasGracia?: number;

  // Datos enriquecidos (viene del backend con joins)
  nombreMateria: string;
  horasMateria: number;
  nombrePlantilla: string;
  nombreAreaCompetencia: string;

  paralelo?: {
    idMallaParalelo?: number;
    idMalla?: number;
    idParalelo: number;
    nombreParalelo: string;
    idTipoJornada?: number;
    cupoMaximo: number;
    esActivo?: boolean;
    alumnosMatriculados?: number;
    nombreDocente?: string;
  }[];
}

export interface DetalleMallaDTOResponse{
  hasNextPage : boolean;
  hasPreviousPage : boolean;
  pageNumber : number;
  pageSize : number;
  totalCount : number;
  items : DetalleMallaDTO[];
}

/**
 * DTO para crear un nuevo DetalleMalla
 */
export interface DetalleMallaCreateDTO {
  idMalla: number;
  idMateria: number;
  idPlantillaEvaluacion: number;
  idAreaCompetencia: number;
  modulo: number;
  fechaInicio: string;
  fechaFin: string;
  duracionHoras: number;
  diasGracia?: number;
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
  modulo: number;
  fechaInicio: string;
  fechaFin: string;
  duracionHoras: number;
  diasGracia?: number;
}

/**
 * DTO simplificado para dropdowns y seleccion
 */
export interface DetalleMallaSimpleDTO {
  idDetalleMalla: number;
  nombreMateria: string;
  horasMateria: number;
}

export interface FechasSugeridasModuloDTO {
  tieneFechasSugeridas: boolean;
  modulo: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

