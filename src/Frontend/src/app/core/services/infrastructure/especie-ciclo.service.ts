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
    return this.http.get<any>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.getAll}`)
      .pipe(map(response => {
        if (response && response.data) {
          return response.data;
        }
        // Si la respuesta es directamente un array
        else if (Array.isArray(response)) {
          return response as EspecieCicloDTO[];
        }

        return [];
      }));
  }

  getEspecieCiclobyId(id: number): Observable<EspecieCicloDTO | null> {
    return this.http.get<IResponse<EspecieCicloDTO>>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.getById(id)}`)
      .pipe(map(r => r.data || null));
  }

  private unwrapData<T>(response: any): T | null {
    if (response == null) return null;
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as IResponse<T>).data ?? null;
    }
    return response as T;
  }

  /**
   * Crear nueva especie ciclo
   */
  create(data: EspecieCicloDTO): Observable<EspecieCicloDTO> {
    return this.http.post<any>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.create}`, data)
      .pipe(map(r => this.unwrapData<EspecieCicloDTO>(r) as EspecieCicloDTO));
  }

  /**
   * Actualizar especie ciclo
   */
  update(data: EspecieCicloDTO): Observable<EspecieCicloDTO> {
    return this.http.put<any>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.update}`, data)
      .pipe(map(r => this.unwrapData<EspecieCicloDTO>(r) as EspecieCicloDTO));
  }

  /**
   * Eliminar especie ciclo
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<IResponse<boolean>>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.getById(id)}`)
      .pipe(map(r => r.isSuccess));
  }

  /**
   * Obtener especies ciclo por malla
   */
  getByMalla(idMalla: number): Observable<EspecieCicloDTO[]> {
    return this.http.get<IResponse<EspecieCicloDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.especieCiclo.getByMalla(idMalla)}`)
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