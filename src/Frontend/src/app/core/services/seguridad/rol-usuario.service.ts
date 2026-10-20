import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RolUsuarioDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class RolUsuarioService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las asignaciones de rol a usuario
  getRolUsuarios(): Observable<RolUsuarioDTO[]> {
    return this.http.get<IResponse<RolUsuarioDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolUsuario.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener asignaciones por rol
  getRolUsuariosByRol(idRol: number): Observable<RolUsuarioDTO[]> {
    return this.http.get<IResponse<RolUsuarioDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolUsuario.getByRol(idRol)}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener asignaciones por persona
  getRolUsuariosByPersona(idPersona: number): Observable<RolUsuarioDTO[]> {
    return this.http.get<IResponse<RolUsuarioDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolUsuario.getByPersona(idPersona)}`).pipe(
      map(response => response.data)
    );
  }

  // Crear asignación de rol a usuario
  createRolUsuario(rolUsuario: RolUsuarioDTO): Observable<RolUsuarioDTO> {
    return this.http.post<IResponse<RolUsuarioDTO>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolUsuario.create}`, rolUsuario).pipe(
      map(response => response.data)
    );
  }

  // Actualizar asignación de rol a usuario
  updateRolUsuario(rolUsuario: RolUsuarioDTO): Observable<RolUsuarioDTO> {
    return this.http.put<IResponse<RolUsuarioDTO>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolUsuario.update}`, rolUsuario).pipe(
      map(response => response.data)
    );
  }

  // Eliminar asignación de rol a usuario
  deleteRolUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rolUsuario.delete(id)}`);
  }

  // Obtener asignación por ID
  getRolUsuarioById(id: number): Observable<RolUsuarioDTO | undefined> {
    return this.getRolUsuarios().pipe(
      map(rolUsuarios => rolUsuarios.find(ru => ru.idRolUsuario === id))
    );
  }
}