/**
 * DTO principal de Distributivo
 */
export interface DistributivoDTO {
  idDistributivo: number;
  idDetalleMalla: number;
  idPersona: number | null;
  idMallaParalelo: number;
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
  tieneDocente: boolean;

  // Conteo de alumnos
  cantidadAlumnos: number;

  // Datos de Plantilla (agregados para consistencia con AsignacionDocenteDTO)
  idPlantillaEvaluacion?: number;
  nombrePlantilla?: string;

  // Fechas de notas
  fechaInicio?: string;
  fechaFin?: string;
  diasGracia?: number;
  statusPeriodo?: string;
}

/**
 * DTO para crear un nuevo Distributivo
 */
export interface DistributivoCreateDTO {
  idDetalleMalla: number;
  idPersona: number;
  idMallaParalelo: number;
}

/**
 * DTO para actualizar un Distributivo
 */
export interface DistributivoUpdateDTO {
  idDistributivo: number;
  idDetalleMalla: number;
  idPersona: number;
  idMallaParalelo: number;
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
  idMateria?: number;
  nombreMateria: string;
  horas: number;
  idPlantillaEvaluacion?: number;
  nombrePlantilla?: string;
  modulo?: number;
  fechaInicio?: string;
  fechaFin?: string;
  diasGracia?: number;
  statusPeriodo?: string;
  paralelos: ParaleloCargaDTO[];
}

export interface ParaleloCargaDTO {
  idDistributivo: number;
  idParalelo: number;
  idMallaParalelo?: number;
  nombreParalelo: string;
  cantidadAlumnos: number;
  alumnosCalificados?: number;
  alumnosSinCalificar?: number;
  tieneDocente?: boolean;
  nombreDocente?: string;
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
  alumnos?: any[]; // Lista de alumnos para contar únicos
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
  fechaInicio?: string;
  fechaFin?: string;
  diasGracia?: number;
}

export interface DistributivoItemDTO {
  idDistributivo: number;
  idDetalleMalla: number;
  idMateria: number;
  nombreMateria: string;
  horasMateria: number;
  idPersona: number | null;
  nombreDocente: string;
  documentoDocente: string;
  tieneDocente: boolean;
  esActivo?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  diasGracia?: number;
  statusPeriodo?: string;
}
