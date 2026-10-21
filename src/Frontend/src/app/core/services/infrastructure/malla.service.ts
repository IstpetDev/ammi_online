import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MallaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class MallaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private normalizeMallasResponse(response: any): MallaDTO[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }

    if (response?.data?.items && Array.isArray(response.data.items)) {
      return response.data.items;
    }

    if (response?.items && Array.isArray(response.items)) {
      return response.items;
    }

    return [];
  }

  private unwrapData<T>(response: any): T | null {
    if (response == null) return null;
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as IResponse<T>).data ?? null;
    }
    return response as T;
  }

  // Obtener todas las mallas
  getAll(): Observable<MallaDTO[]> {
    return this.http.get<any>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallas.getAll}`).pipe(
      map(response => this.normalizeMallasResponse(response))
    );
  }

  // Obtener mallas por ciclo
  getByCiclo(idCiclo: number): Observable<MallaDTO[]> {
    return this.http.get<any>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallas.getByCiclo(idCiclo)}`).pipe(
      map(response => this.normalizeMallasResponse(response))
    );
  }

  // Obtener malla por ID
  getById(id: number): Observable<MallaDTO | undefined> {
    return this.getAll().pipe(
      map(mallas => mallas.find(m => m.idMalla === id))
    );
  }

  // Crear una nueva malla
  create(malla: MallaDTO): Observable<MallaDTO> {
    return this.http.post<any>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallas.create}`, malla).pipe(
      map(response => this.unwrapData<MallaDTO>(response) as MallaDTO)
    );
  }

  // Actualizar una malla
  update(malla: MallaDTO): Observable<MallaDTO> {
    return this.http.put<any>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallas.update}`, malla).pipe(
      map(response => this.unwrapData<MallaDTO>(response) as MallaDTO)
    );
  }

  // Eliminar una malla por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallas.delete(id)}`);
  }
}