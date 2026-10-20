import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IResponse } from '../../../data/models/IResponse';
import { EspecieDTO } from '../../../data/models/Entities';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class EspecieService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las especies
   */
  getAll(): Observable<EspecieDTO[]> {
    console.log('🌐 EspecieService.getAll llamado');
    return this.http.get<any>(`${this.apiUrl}${API_ENDPOINTS.especie.getAll}`)
      .pipe(map(response => {
        console.log('🌐 Respuesta RAW del backend:', response);
        console.log('🌐 Tipo de respuesta:', typeof response);
        console.log('🌐 ¿Tiene propiedad data?', 'data' in response);
        console.log('🌐 ¿Es array directamente?', Array.isArray(response));

        // Si la respuesta tiene una propiedad 'data', es un IResponse
        if (response && response.data) {
          console.log('🌐 Respuesta tipo IResponse, retornando response.data');
          return response.data;
        }
        // Si la respuesta es directamente un array
        else if (Array.isArray(response)) {
          console.log('🌐 Respuesta directa array, retornando response');
          return response as EspecieDTO[];
        }

        console.log('🌐 Respuesta no reconocida, retornando array vacío');
        return [];
      }));
  }

  /**
   * Crear nueva especie
   */
  create(data: EspecieDTO): Observable<EspecieDTO> {
    return this.http.post<IResponse<EspecieDTO>>(`${this.apiUrl}${API_ENDPOINTS.especie.create}`, data)
      .pipe(map(r => r.data!));
  }

  /**
   * Actualizar especie
   */
  update(data: EspecieDTO): Observable<EspecieDTO> {
    return this.http.put<IResponse<EspecieDTO>>(`${this.apiUrl}${API_ENDPOINTS.especie.update}`, data)
      .pipe(map(r => r.data!));
  }

  /**
   * Eliminar especie
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<IResponse<boolean>>(`${this.apiUrl}${API_ENDPOINTS.especie.delete(id)}`)
      .pipe(map(r => r.isSuccess));
  }
}