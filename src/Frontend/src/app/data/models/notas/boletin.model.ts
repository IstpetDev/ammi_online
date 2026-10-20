/**
 * DTO para Boletin completo del Alumno
 */
export interface BoletinAlumnoDTO {
  idMatricula: number;
  nombreAlumno: string;
  paralelo: string;
  materias: BoletinMateriaDTO[];
}

/**
 * DTO para Materia dentro del Boletin
 */
export interface BoletinMateriaDTO {
  idDetalleMalla: number;
  nombreMateria: string;
  idPlantillaEvaluacion: number;
  estructuraNotas: NotaArbolDTO[];
  notaFinal: number | null;
  estado: EstadoAprobacion;
}

/**
 * DTO para estructura recursiva de notas en arbol
 */
export interface NotaArbolDTO {
  idPlantillaEstructura: number;
  nombreComponente: string;
  peso: number;
  valorNota: number | null;
  esCalculada: boolean;
  observacion: string | null;
  hijos: NotaArbolDTO[];
}

/**
 * Estados de aprobacion posibles
 */
export type EstadoAprobacion =
  | 'Aprobado'
  | 'Reprobado'
  | 'Pendiente'
  | 'Recuperacion'
  | 'Sin regla';
