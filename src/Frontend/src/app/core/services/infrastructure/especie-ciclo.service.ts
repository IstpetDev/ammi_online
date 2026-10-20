import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IResponse } from '../../../data/models/IResponse';
import { EspecieCicloDTO } from '../../../data/models/Entities';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class EspecieCicloService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las especies ciclo
   */
  getAll(): Observable<EspecieCicloDTO[]> {
    console.log('🌐 EspecieCicloService.getAll llamado');
    return this.http.get<any>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.getAll}`)
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
          return response as EspecieCicloDTO[];
        }

        console.log('🌐 Respuesta no reconocida, retornando array vacío');
        return [];
      }));
  }

  /**
   * Crear nueva especie ciclo
   */
  create(data: EspecieCicloDTO): Observable<EspecieCicloDTO> {
    return this.http.post<IResponse<EspecieCicloDTO>>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.create}`, data)
      .pipe(map(r => r.data!));
  }

  /**
   * Actualizar especie ciclo
   */
  update(data: EspecieCicloDTO): Observable<EspecieCicloDTO> {
    return this.http.put<IResponse<EspecieCicloDTO>>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.update}`, data)
      .pipe(map(r => r.data!));
  }

  /**
   * Eliminar especie ciclo
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<IResponse<boolean>>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.getById(id)}`)
      .pipe(map(r => r.isSuccess));
  }

  /**
   * Obtener especies ciclo por ciclo
   */
  getByCiclo(idCiclo: number): Observable<EspecieCicloDTO[]> {
    return this.http.get<IResponse<EspecieCicloDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.getByCiclo(idCiclo)}`)
      .pipe(map(r => r.data || []));
  }

  /**
   * Obtener especie ciclo por ID
   */
  getById(id: number): Observable<EspecieCicloDTO | null> {
    return this.http.get<IResponse<EspecieCicloDTO>>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.getById(id)}`)
      .pipe(map(r => r.data || null));
  }
}