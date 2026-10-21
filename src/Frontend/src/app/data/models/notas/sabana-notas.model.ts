/**
 * Fila individual para el reporte "Sábana de Notas"
 * (Cuadro Macro Final: nota por materia + supletorio + promedio)
 */
export interface SabanaNotaFilaDTO {
  numero: number;
  cedula: string;
  nombreAlumno: string;
  notaFinalMateria: number | null;
  notaSupletorio: number | null;
  promedioFinal: number | null;
  estado: 'Aprobado' | 'Recuperación' | 'Reprobado' | 'Sin nota';
}

/**
 * Fila para el reporte "Calificaciones del Quimestre"
 * (Una fila por alumno con la nota final de cada materia del paralelo)
 */
export interface QuimestreFilaDTO {
  numero: number;
  cedula: string;
  nombreAlumno: string;
  /** Mapa idDetalleMalla → notaFinal de la materia */
  notasPorMateria: { [idDetalleMalla: number]: number | null };
  /** Mapa idDetalleMalla → notaSupletorio (remedial) */
  supletorioPorMateria: { [idDetalleMalla: number]: number | null };
  promedio: number | null;
  observacion: 'PROMOVIDO' | 'SUPLETORIO' | 'REPROBADO' | 'PENDIENTE';
}

/**
 * Metadatos de una materia del quimestre (columna del reporte)
 */
export interface QuimesteMateriaColumnaDTO {
  idDetalleMalla: number;
  nombreMateria: string;
  idMallaParalelo: number;
  idPlantillaEvaluacion: number;
}
