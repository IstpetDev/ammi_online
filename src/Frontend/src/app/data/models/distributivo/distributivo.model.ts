/**
 * DTO principal de Distributivo
 */
export interface DistributivoDTO {
  idDistributivo: number;
  idDetalleMalla: number;
  idPersona: number;
  idParalelo: number;

  // Datos del DetalleMalla
  idMalla: number;
  idMateria: number;

  // Datos de la Materia
  nombreMateria: string;
  horasMateria: number;

  // Datos de la Malla
  nombreMalla: string;
  tipoOferta: string;

  // Datos del Ciclo
  idCiclo: number;
  nombreCiclo: string;

  // Datos del Paralelo
  nombreParalelo: string;
  cupoMaximo?: number;

  // Datos del Docente
  nombreDocente: string;
  documentoDocente: string;

  // Conteo de alumnos
  cantidadAlumnos: number;

  // Datos de Plantilla (agregados para consistencia con AsignacionDocenteDTO)
  idPlantillaEvaluacion?: number;
  nombrePlantilla?: string;
}

/**
 * DTO para crear un nuevo Distributivo
 */
export interface DistributivoCreateDTO {
  idDetalleMalla: number;
  idPersona: number;
  idParalelo: number;
}

/**
 * DTO para actualizar un Distributivo
 */
export interface DistributivoUpdateDTO {
  idDistributivo: number;
  idDetalleMalla: number;
  idPersona: number;
  idParalelo: number;
}

/**
 * DTO para asignacion masiva
 */
export interface DistributivoMasivoDTO {
  idDetalleMalla: number;
  idPersona: number;
  idsParalelos: number[];
}

/**
 * DTO para carga academica de docente
 */
export interface CargaDocenteDTO {
  idPersona: number;
  nombreDocente: string;
  documentoDocente: string;
  totalMaterias: number;
  totalParalelos: number;
  totalAlumnos: number;
  totalHoras: number;
  mallas: MallaCargaDTO[];
}

export interface MallaCargaDTO {
  idMalla: number;
  nombreMalla: string;
  materias: MateriaCargaDTO[];
}

export interface MateriaCargaDTO {
  idDetalleMalla: number;
  nombreMateria: string;
  horas: number;
  paralelos: ParaleloCargaDTO[];
}

export interface ParaleloCargaDTO {
  idDistributivo: number;
  idParalelo: number;
  nombreParalelo: string;
  cantidadAlumnos: number;
}

/**
 * DTO para listar docentes disponibles
 */
export interface DocenteDisponibleDTO {
  idPersona: number;
  nombreCompleto: string;
  documento: string;

  asignacionesActuales: number;
}

/**
 * DTO para asignacion de docente (vista simplificada)
 */
export interface AsignacionDocenteDTO {
  idDistributivo: number;
  idDetalleMalla: number;
  idParalelo: number;
  nombreMateria: string;
  nombreParalelo: string;
  idPlantillaEvaluacion: number;
  nombrePlantilla: string;
  cantidadAlumnos: number;
  idMalla: number;
  nombreMalla: string;
}


/**
 * DTO para DetalleMalla (referencia)
 */
export interface DetalleMallaDTO {
  idDetalleMalla: number;
  idMalla: number;
  idMateria: number;
  idPlantillaEvaluacion: number;
  idAreaCompetencia: number;
  nombreMateria?: string;
  horasMateria?: number;
  nombreMalla?: string;
}
