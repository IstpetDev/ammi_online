/**
 * DTO para lectura de Nota de Alumno
 */
export interface NotasAlumnoDTO {
  idNotasAlumno: number;
  idDetalleMatricula: number;
  idPlantillaEstructura: number;
  valorNota: number | null;
  observacion: string | null;
  nombreComponente?: string;
  pesoComponente?: number;
  // Campos adicionales del backend
  idMatricula?: number;
  nombreMateria?: string;
  examenRemedial?: number | null;
}

/**
 * DTO para crear una Nota de Alumno
 */
export interface NotasAlumnoCreateDTO {
  idDetalleMatricula: number;
  idPlantillaEstructura: number;
  valorNota: number;
  observacion?: string | null;
}

/**
 * DTO para actualizar una Nota de Alumno
 */
export interface NotasAlumnoUpdateDTO {
  idNotasAlumno: number;
  valorNota: number;
  observacion?: string | null;
}

/**
 * DTO para crear Notas de forma masiva
 */
export interface NotasMasivasDTO {
  idPlantillaEstructura: number;
  notas: NotaAlumnoItemDTO[];
}

/**
 * DTO para item de nota en ingreso masivo
 */
export interface NotaAlumnoItemDTO {
  idDetalleMatricula: number;
  valorNota: number;
  observacion?: string | null;
}
