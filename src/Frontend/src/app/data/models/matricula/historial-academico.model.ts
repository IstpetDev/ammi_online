/**
 * DTO para matricula con detalles extendidos
 */
export interface MatriculaConDetalleDTO {
  idMatricula: number;
  idUsuarioAlumno: number;
  idParalelo: number;
  esFinalizada: boolean;
  nombreParalelo: string;
  idMalla: number;
  nombreMalla: string;
  idCiclo: number;
  nombreCiclo: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  materias: DetalleMateriaInscritaDTO[];
}

/**
 * DTO para detalle de materia inscrita
 */
export interface DetalleMateriaInscritaDTO {
  idDetalleMatricula: number;
  idDetalleMalla: number;
  nombreMateria: string;
  notaFinal: number | null;
  estado: EstadoMateria;
}

/**
 * Estados posibles de una materia
 */
export type EstadoMateria = 'Aprobado' | 'Reprobado' | 'En curso' | 'Pendiente';

/**
 * DTO para historial academico completo del alumno
 */
export interface HistorialAcademicoDTO {
  idUsuario: number;
  nombreAlumno: string;
  numeroDocumento: string;
  mallas: MallaHistorialDTO[];
}

/**
 * DTO para malla dentro del historial
 */
export interface MallaHistorialDTO {
  idMalla: number;
  nombreMalla: string;
  tipoOferta: string;
  ciclos: CicloHistorialDTO[];
}

/**
 * DTO para ciclo dentro del historial
 */
export interface CicloHistorialDTO {
  idCiclo: number;
  nombreCiclo: string;
  nombreParalelo?: string | null;
  fechaInicio?: string | Date;
  fechaFin?: string | Date;
  idMatricula: number;
  materias: MateriaHistorialDTO[];
  promedioGeneral?: number;
}

/**
 * DTO para materia dentro del historial
 */
export interface MateriaHistorialDTO {
  idDetalleMalla: number;
  idDetalleMatricula?: number | null;
  idPlantillaEvaluacion?: number | null;
  nombreMateria: string;
  notaFinal: number | null;
  examenRemedial: number | null;
  estado: string | null;
  docente?: string | null;
  emailDocente?: string | null;
  fechaInicio?: string | Date | null;
  fechaFin?: string | Date | null;
  duracionHoras?: number | null;
  modulo?: number | null;
  areaCompetencia?: string | null;
  diasGracia?: number | null;
  statusPeriodo?: string | null;
  periodoActivo?: boolean;
  mensajePeriodo?: string | null;
}

/**
 * DTO para alumno de un paralelo (para ingreso de notas)
 */
export interface AlumnoParaleloDTO {
  idMatricula: number;
  idUsuarioAlumno: number;
  nombreAlumno: string;
  documentoAlumno: string;
  notaActual?: number | null;
  observacion?: string | null;
}

/**
 * DTO para resumen de notas de un paralelo
 */
export interface ResumenNotasParaleloDTO {
  idParalelo: number;
  nombreParalelo: string;
  idDetalleMalla: number;
  nombreMateria: string;
  nombreDocente: string;
  totalAlumnos: number;
  alumnosConNotas: number;
  alumnosAprobados: number;
  alumnosReprobados: number;
  alumnosPendientes: number;
  promedioGeneral: number;
  notaMaxima: number;
  notaMinima: number;
}
