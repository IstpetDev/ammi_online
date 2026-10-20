import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RolOperacionDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class RolOperacionService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las operaciones de rol
  getRolOperaciones(): Observable<RolOperacionDTO[]> {
    return this.http.get<IResponse<RolOperacionDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolOperacion.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener operaciones activas
  getRolOperacionesActivas(): Observable<RolOperacionDTO[]> {
    return this.http.get<IResponse<RolOperacionDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolOperacion.getActivos}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener operaciones por rol
  getRolOperacionesByRol(idRol: number): Observable<RolOperacionDTO[]> {
    return this.http.get<IResponse<RolOperacionDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolOperacion.getByRol(idRol)}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener operaciones por módulo operación
  getRolOperacionesByModuloOperacion(idModuloOperacion: number): Observable<RolOperacionDTO[]> {
    return this.http.get<IResponse<RolOperacionDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolOperacion.getByModuloOperacion(idModuloOperacion)}`).pipe(
      map(response => response.data)
    );
  }

  // Crear operación de rol
  createRolOperacion(rolOperacion: RolOperacionDTO): Observable<RolOperacionDTO> {
    return this.http.post<IResponse<RolOperacionDTO>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolOperacion.create}`, { rolOperacion }).pipe(
      map(response => response.data)
    );
  }

  // Actualizar operación de rol
  updateRolOperacion(rolOperacion: RolOperacionDTO): Observable<RolOperacionDTO> {
    return this.http.put<IResponse<RolOperacionDTO>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolOperacion.update}`, { rolOperacion }).pipe(
      map(response => response.data)
    );
  }

  // Eliminar operación de rol
  deleteRolOperacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolOperacion.delete(id)}`);
  }

  // Obtener operación por ID
  getRolOperacionById(id: number): Observable<RolOperacionDTO | undefined> {
    return this.getRolOperaciones().pipe(
      map(operaciones => operaciones.find(o => o.idRolOperacion === id))
    );
  }
}