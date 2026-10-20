import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';
import {
  PlantillaEstructuraDTO,
  PlantillaEstructuraCreateDTO,
  PlantillaEstructuraUpdateDTO,
  CrearEstructuraCompletaDTO,
  ValidacionPesosDTO,
  PlantillaEvaluacionDTO,
  TipoPlantillaEstructuraDTO
} from '../../../data/models/notas';

@Injectable({
  providedIn: 'root'
})
export class PlantillaEstructuraService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener tipos de estructura (catalogo)
   */
  getTipos(): Observable<TipoPlantillaEstructuraDTO[]> {
    return this.http.get<TipoPlantillaEstructuraDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.tipoPlantillaEstructura.getAll}`
    );
  }

  /**
   * Obtener estructura como arbol jerarquico
   */
  getArbol(idPlantillaEvaluacion: number): Observable<PlantillaEstructuraDTO[]> {
    return this.http.get<PlantillaEstructuraDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEstructura.getArbol(idPlantillaEvaluacion)}`
    );
  }

  /**
   * Obtener lista plana de nodos
   */
  getNodos(idPlantillaEvaluacion: number): Observable<PlantillaEstructuraDTO[]> {
    return this.http.get<PlantillaEstructuraDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEstructura.getNodos(idPlantillaEvaluacion)}`
    );
  }

  /**
   * Obtener nodo por ID
   */
  getById(id: number): Observable<PlantillaEstructuraDTO> {
    return this.http.get<PlantillaEstructuraDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEstructura.getById(id)}`
    );
  }

  /**
   * Validar que los pesos sumen 100%
   */
  validarPesos(idPlantillaEvaluacion: number): Observable<ValidacionPesosDTO> {
    return this.http.get<ValidacionPesosDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEstructura.validar(idPlantillaEvaluacion)}`
    );
  }

  /**
   * Crear un nodo individual
   */
  create(nodo: PlantillaEstructuraCreateDTO): Observable<PlantillaEstructuraDTO> {
    return this.http.post<PlantillaEstructuraDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEstructura.create}`,
      nodo
    );
  }

  /**
   * Crear estructura completa anidada
   */
  createCompleta(estructura: CrearEstructuraCompletaDTO): Observable<boolean> {
    return this.http.post<boolean>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEstructura.createCompleta}`,
      estructura
    );
  }

  /**
   * Actualizar nodo existente
   */
  update(nodo: PlantillaEstructuraUpdateDTO): Observable<PlantillaEstructuraDTO> {
    return this.http.put<PlantillaEstructuraDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEstructura.update}`,
      nodo
    );
  }

  /**
   * Reordenar nodos
   */
  reordenar(idsOrdenados: number[]): Observable<boolean> {
    return this.http.put<boolean>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEstructura.reordenar}`,
      { idsOrdenados }
    );
  }

  /**
   * Eliminar nodo (y sus hijos)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEstructura.delete(id)}`
    );
  }

  /**
   * Duplicar plantilla con toda su estructura
   */
  duplicarPlantilla(id: number, nuevoNombre: string): Observable<PlantillaEvaluacionDTO> {
    return this.http.post<PlantillaEvaluacionDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEstructura.duplicar(id)}`,
      { nuevoNombre }
    );
  }
}
