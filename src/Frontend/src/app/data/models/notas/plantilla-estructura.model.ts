/**
 * DTO para nodo de estructura (arbol)
 */
export interface PlantillaEstructuraDTO {
  idPlantillaEstructura: number;
  idPlantillaEvaluacion: number;
  idNodoPadre: number | null;
  idNodoHermano: number | null;
  nodoNombre: string;
  peso: number;                          // Porcentaje (0-100)
  idTipoPlantillaEstructura: number;
  orden: number;
  tipoNombre?: string;
  formula?: string;
  parametrosFormula?: any;
  hijos: PlantillaEstructuraDTO[];       // Nodos hijos (recursivo)
}

/**
 * DTO para crear un nodo individual
 */
export interface PlantillaEstructuraCreateDTO {
  idPlantillaEvaluacion: number;
  idNodoPadre: number | null;
  nodoNombre: string;
  peso: number;
  idTipoPlantillaEstructura: number;
  orden: number;
  formula?: string;
  parametrosFormula?: any;
}

/**
 * DTO para actualizar un nodo
 */
export interface PlantillaEstructuraUpdateDTO {
  idPlantillaEstructura: number;
  nodoNombre: string;
  peso: number;
  idTipoPlantillaEstructura: number;
  orden: number;
  formula?: string;
  parametrosFormula?: any;
}

/**
 * DTO para crear estructura completa anidada
 */
export interface CrearEstructuraCompletaDTO {
  idPlantillaEvaluacion: number;
  nodos: NodoEstructuraDTO[];
}

/**
 * DTO para nodo en creacion (sin IDs)
 */
export interface NodoEstructuraDTO {
  nodoNombre: string;
  peso: number;
  idTipoPlantillaEstructura: number;
  orden: number;
  hijos: NodoEstructuraDTO[];
}

/**
 * DTO para resultado de validacion de pesos
 */
export interface ValidacionPesosDTO {
  esValido: boolean;
  pesoTotal: number;
  mensaje: string;
  nodosInvalidos: NodoInvalidoDTO[];
}

/**
 * DTO para nodo con peso invalido
 */
export interface NodoInvalidoDTO {
  idNodo: number;
  nombreNodo: string;
  pesoHijos: number;
  problema: string;
}

/**
 * DTO para tipo de nodo (catalogo)
 */
export interface TipoPlantillaEstructuraDTO {
  idTipoPlantillaEstrucutra: number;
  detalle: string;
}

/**
 * Interface para TreeNode de PrimeNG (display)
 */
export interface NodoArbolUI {
  key: string;
  label: string;
  data: PlantillaEstructuraDTO;
  icon: string;
  children?: NodoArbolUI[];
  expanded?: boolean;
  styleClass?: string;
}
