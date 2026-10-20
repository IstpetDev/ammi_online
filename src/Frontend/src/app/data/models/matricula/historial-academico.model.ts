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
  fechaInicio?: Date;
  fechaFin?: Date;
  idMatricula: number;
  materias: MateriaHistorialDTO[];
  promedioGeneral: number;
}

/**
 * DTO para materia dentro del historial
 */
export interface MateriaHistorialDTO {
  idDetalleMalla: number;
  nombreMateria: string;
  notaFinal: number | null;
  estado: EstadoMateria;
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
