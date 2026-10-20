import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RolDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class RolService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los roles
  getRoles(): Observable<RolDTO[]> {
    return this.http.get<IResponse<RolDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rol.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener rol por ID
  getRolById(id: number): Observable<RolDTO | undefined> {
    return this.getRoles().pipe(
      map(roles => roles.find(r => r.idRol === id))
    );
  }

  // Crear rol
  createRol(rol: RolDTO): Observable<RolDTO> {
    return this.http.post<IResponse<RolDTO>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rol.create}`, rol).pipe(
      map(response => response.data)
    );
  }

  // Actualizar rol
  updateRol(rol: RolDTO): Observable<RolDTO> {
    return this.http.put<IResponse<RolDTO>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rol.update}`, rol).pipe(
      map(response => response.data)
    );
  }

  // Eliminar rol
  deleteRol(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.seguridad.rol.delete(id)}`);
  }
}