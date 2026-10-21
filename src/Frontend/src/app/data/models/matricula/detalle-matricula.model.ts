/**
 * DTO de DetalleMatricula - Alumno inscrito en una materia específica
 */
export interface DetalleMatriculaDTO {
  idDetalleMatricula: number;
  idMatricula: number;
  idDetalleMalla: number;
}

/**
 * DTO con datos del alumno para ingreso de notas
 */
export interface DetalleMatriculaConAlumnoDTO {
  idDetalleMatricula: number | null;
  idMatricula: number;
  idDetalleMalla: number;
  nombreAlumno: string;
  documentoAlumno: string;
  idUsuario?: number;
  // Campos opcionales que el backend puede incluir
  notaFinal?: number | null;
  notaRemedial?: number | null;
  estado?: string | null;
}
