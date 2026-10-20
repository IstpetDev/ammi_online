import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';
import {
  ReglasCalculoDTO,
  ReglasCalculoCreateDTO,
  ReglasCalculoUpdateDTO
} from '../../../data/models/notas';

@Injectable({
  providedIn: 'root'
})
export class ReglasCalculoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener regla de calculo por ID
   */
  getById(id: number): Observable<ReglasCalculoDTO> {
    return this.http.get<ReglasCalculoDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.reglasCalculo.getById(id)}`
    );
  }

  /**
   * Obtener reglas de calculo por nodo de estructura
   */
  getByEstructura(idPlantillaEstructura: number): Observable<ReglasCalculoDTO[]> {
    return this.http.get<ReglasCalculoDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.reglasCalculo.getByEstructura(idPlantillaEstructura)}`
    );
  }

  /**
   * Obtener todas las reglas de calculo de una plantilla
   */
  getByPlantilla(idPlantillaEvaluacion: number): Observable<ReglasCalculoDTO[]> {
    return this.http.get<ReglasCalculoDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.reglasCalculo.getByPlantilla(idPlantillaEvaluacion)}`
    );
  }

  /**
   * Crear nueva regla de calculo
   */
  create(data: ReglasCalculoCreateDTO): Observable<ReglasCalculoDTO> {
    return this.http.post<ReglasCalculoDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.reglasCalculo.create}`,
      data
    );
  }

  /**
   * Actualizar regla de calculo
   */
  update(data: ReglasCalculoUpdateDTO): Observable<ReglasCalculoDTO> {
    return this.http.put<ReglasCalculoDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.reglasCalculo.update}`,
      data
    );
  }

  /**
   * Eliminar regla de calculo
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(
      `${this.apiUrl}${API_ENDPOINTS.notas.reglasCalculo.delete(id)}`
    );
  }
}
