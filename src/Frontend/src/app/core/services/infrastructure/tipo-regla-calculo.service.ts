import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';
import {
  TipoReglaCalculoDTO,
  TipoReglaCalculoCreateDTO,
  TipoReglaCalculoUpdateDTO
} from '../../../data/models/notas';

@Injectable({
  providedIn: 'root'
})
export class TipoReglaCalculoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los tipos de regla de calculo
   */
  getAll(): Observable<TipoReglaCalculoDTO[]> {
    return this.http.get<TipoReglaCalculoDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.tipoReglaCalculo.getAll}`
    );
  }

  /**
   * Crear nuevo tipo de regla de calculo
   */
  create(data: TipoReglaCalculoCreateDTO): Observable<TipoReglaCalculoDTO> {
    return this.http.post<TipoReglaCalculoDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.tipoReglaCalculo.create}`,
      data
    );
  }

  /**
   * Actualizar tipo de regla de calculo
   */
  update(data: TipoReglaCalculoUpdateDTO): Observable<TipoReglaCalculoDTO> {
    return this.http.put<TipoReglaCalculoDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.tipoReglaCalculo.update}`,
      data
    );
  }

  /**
   * Eliminar tipo de regla de calculo
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(
      `${this.apiUrl}${API_ENDPOINTS.notas.tipoReglaCalculo.delete(id)}`
    );
  }
}
