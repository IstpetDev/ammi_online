import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';
import {
  PlantillaEvaluacionDTO,
  PlantillaEvaluacionCreateDTO,
  PlantillaEvaluacionUpdateDTO
} from '../../../data/models/notas';

@Injectable({
  providedIn: 'root'
})
export class PlantillaEvaluacionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las plantillas de evaluacion
   */
  getAll(): Observable<PlantillaEvaluacionDTO[]> {
    return this.http.get<PlantillaEvaluacionDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEvaluacion.getAll}`
    );
  }

  /**
   * Obtener solo plantillas activas
   */
  getActivas(): Observable<PlantillaEvaluacionDTO[]> {
    return this.http.get<PlantillaEvaluacionDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEvaluacion.getActivos}`
    );
  }

  /**
   * Obtener plantilla por ID
   */
  getById(id: number): Observable<PlantillaEvaluacionDTO> {
    return this.http.get<PlantillaEvaluacionDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEvaluacion.getById(id)}`
    );
  }

  /**
   * Crear nueva plantilla
   */
  create(plantilla: PlantillaEvaluacionCreateDTO): Observable<PlantillaEvaluacionDTO> {
    return this.http.post<PlantillaEvaluacionDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEvaluacion.create}`,
      plantilla
    );
  }

  /**
   * Actualizar plantilla existente
   */
  update(plantilla: PlantillaEvaluacionUpdateDTO): Observable<PlantillaEvaluacionDTO> {
    return this.http.put<PlantillaEvaluacionDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEvaluacion.update}`,
      plantilla
    );
  }

  /**
   * Eliminar plantilla por ID
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(
      `${this.apiUrl}${API_ENDPOINTS.notas.plantillaEvaluacion.delete(id)}`
    );
  }
}
