import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IResponse } from '../../../data/models/IResponse';
import { CicloDTO } from '../../../data/models/Entities';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class CicloService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los ciclos
   */
  getAll(): Observable<CicloDTO[]> {
    console.log('🌐 CicloService.getAll llamado');
    return this.http.get<any>(`${this.apiUrl}${API_ENDPOINTS.ciclo.getAll}`)
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
          return response as CicloDTO[];
        }

        console.log('🌐 Respuesta no reconocida, retornando array vacío');
        return [];
      }));
  }

  /**
   * Crear nuevo ciclo
   */
  create(data: CicloDTO): Observable<CicloDTO> {
    return this.http.post<IResponse<CicloDTO>>(`${this.apiUrl}${API_ENDPOINTS.ciclo.create}`, data)
      .pipe(map(r => r.data!));
  }

  /**
   * Actualizar ciclo
   */
  update(data: CicloDTO): Observable<CicloDTO> {
    return this.http.put<IResponse<CicloDTO>>(`${this.apiUrl}${API_ENDPOINTS.ciclo.update}`, data)
      .pipe(map(r => r.data!));
  }

  /**
   * Eliminar ciclo
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<IResponse<boolean>>(`${this.apiUrl}${API_ENDPOINTS.ciclo.delete(id)}`)
      .pipe(map(r => r.isSuccess));
  }
}