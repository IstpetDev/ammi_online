
/**
 * DTO para lectura de Plantilla de Evaluacion
 */
export interface PlantillaEvaluacionDTO {
  idPlantillaEvaluacion: number;
  nombre: string;
  detalle: string;
  esActivo: boolean;
  cantidadMateriasUsando?: number;
}

/**
 * DTO para crear nueva Plantilla de Evaluacion
 */
export interface PlantillaEvaluacionCreateDTO {
  nombre: string;
  detalle: string;
  esActivo: boolean;
}

/**
 * DTO para actualizar Plantilla de Evaluacion
 */
export interface PlantillaEvaluacionUpdateDTO {
  idPlantillaEvaluacion: number;
  nombre: string;
  detalle: string;
  esActivo: boolean;
}

/**
 * DTO extendido con estructura completa (para vista detallada)
 */
import { PlantillaEstructuraDTO } from './plantilla-estructura.model';

export interface PlantillaEvaluacionCompletaDTO extends PlantillaEvaluacionDTO {
  estructura: PlantillaEstructuraDTO[];
  estructuraValida: boolean;
  mensajeValidacion: string;
}
