export enum MotivoReMatricula {
  REPETIR = 0,
  AVANZAR = 1,
  SIN_CALIFICACIONES = 2,
  YA_MATRICULADO = 3,
  SIN_MATRICULA_PREVIA = 4,
  MALLA_DESTINO_NO_ENCONTRADA = 5,
  SIN_PARALELOS_DISPONIBLES = 6,
  DEUDA_PENDIENTE = 7,
}

export interface ParaleloDisponible {
  idMallaParalelo: number;
  detalleParalelo: string | null;
  cupoMaximo: number;
  matriculados: number;
  cupoDisponible: number;
}

export interface ReMatriculaInfo {
  idPersona: number;
  idMatriculaActual: number | null;
  puedeReMatricular: boolean;
  motivo: MotivoReMatricula;
  mensajeDiagnostico: string;
  idMallaOrigen: number | null;
  detalleMallaOrigen: string | null;
  idCursosOrigen: number | null;
  ordenCursosOrigen: number | null;
  idMallaDestino: number | null;
  detalleMallaDestino: string | null;
  paralelosDisponibles: ParaleloDisponible[];
}

export interface ReMatricularRequest {
  idPersona: number;
  idCicloDestino: number;
  idMallaParalelo: number;
  cerrarMatriculaAnterior?: boolean;
  idEstadoMatriculaCompletado?: number;
}

export interface ReMatricularResult {
  idPersona: number;
  idMatriculaNueva: number;
  idMallaParalelo: number;
  matriculaAnteriorCerrada: boolean;
  resumen: string;
}

export interface ClonarMallasRequest {
  idCicloOrigen: number;
  idCicloDestino: number;
  clonarParalelos?: boolean;
}

export interface ClonarMallaItem {
  idMallaOrigen: number;
  idMallaDestino: number;
  detalle: string | null;
  totalDetalles: number;
  totalRequisitos: number;
  totalEspecies: number;
  totalParalelos: number;
}

export interface ClonarMallasResult {
  idCicloOrigen: number;
  idCicloDestino: number;
  totalMallasClonadas: number;
  mallas: ClonarMallaItem[];
  resumen: string;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  errores?: Record<string, string[]>;
}

export interface EstadoMatriculaDTO {
  idEstadoMatricula: number;
  detalle: string;
  completado: boolean;
}
