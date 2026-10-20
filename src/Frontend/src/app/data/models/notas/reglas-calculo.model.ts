/**
 * DTO para lectura de Regla de Calculo
 */
export interface ReglasCalculoDTO {
  idReglasCalculo: number;
  idTipoReglaCalculo: number;
  idPlantillaEstructura: number;
  notaMinimaAprobar: number | null;
  notaMinimaRecuperar: number | null;
  tipoReglaDetalle?: string;
  nodoNombre?: string;
}

/**
 * DTO para crear una Regla de Calculo
 */
export interface ReglasCalculoCreateDTO {
  idTipoReglaCalculo: number;
  idPlantillaEstructura: number;
  notaMinimaAprobar: number | null;
  notaMinimaRecuperar: number | null;
}

/**
 * DTO para actualizar una Regla de Calculo
 */
export interface ReglasCalculoUpdateDTO {
  idReglasCalculo: number;
  idTipoReglaCalculo: number;
  notaMinimaAprobar: number | null;
  notaMinimaRecuperar: number | null;
}

/**
 * DTO para Tipo de Regla de Calculo (catalogo)
 */
export interface TipoReglaCalculoDTO {
  idTipoReglaCalculo: number;
  detalle: string;
}

/**
 * DTO para crear Tipo de Regla de Calculo
 */
export interface TipoReglaCalculoCreateDTO {
  detalle: string;
}

/**
 * DTO para actualizar Tipo de Regla de Calculo
 */
export interface TipoReglaCalculoUpdateDTO {
  idTipoReglaCalculo: number;
  detalle: string;
}
