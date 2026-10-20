import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ModuloOperacionDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class ModuloOperacionService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las operaciones de módulo
  getModuloOperaciones(): Observable<ModuloOperacionDTO[]> {
    return this.http.get<IResponse<ModuloOperacionDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.moduloOperacion.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener operaciones activas
  getModuloOperacionesActivas(): Observable<ModuloOperacionDTO[]> {
    return this.http.get<IResponse<ModuloOperacionDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.moduloOperacion.getActivos}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener operaciones por módulo
  getModuloOperacionesByModulo(idModulo: number): Observable<ModuloOperacionDTO[]> {
    return this.http.get<IResponse<ModuloOperacionDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.moduloOperacion.getByModulo(idModulo)}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener operaciones por operación
  getModuloOperacionesByOperacion(idOperacion: number): Observable<ModuloOperacionDTO[]> {
    return this.http.get<IResponse<ModuloOperacionDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.moduloOperacion.getByOperacion(idOperacion)}`).pipe(
      map(response => response.data)
    );
  }



  // Obtener operación por ID
  getModuloOperacionById(id: number): Observable<ModuloOperacionDTO | undefined> {
    return this.getModuloOperaciones().pipe(
      map(operaciones => operaciones.find(o => o.idModuloOperacion === id))
    );
  }

  // Crear operación de módulo
  createModuloOperacion(moduloOperacion: ModuloOperacionDTO): Observable<ModuloOperacionDTO> {
    return this.http.post<IResponse<ModuloOperacionDTO>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.moduloOperacion.create}`, moduloOperacion).pipe(
      map(response => response.data)
    );
  }

  // Actualizar operación de módulo
  updateModuloOperacion(moduloOperacion: ModuloOperacionDTO): Observable<ModuloOperacionDTO> {
    return this.http.put<IResponse<ModuloOperacionDTO>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.moduloOperacion.update}`, moduloOperacion).pipe(
      map(response => response.data)
    );
  }

  // Eliminar operación de módulo
  deleteModuloOperacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.seguridad.moduloOperacion.delete(id)}`);
  }
}