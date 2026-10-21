import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { UsuarioDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los usuarios
  getAllUsuarios(): Observable<UsuarioDTO[]> {
    return this.http.get<IResponse<UsuarioDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.usuario.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Crear usuario
  createUsuario(usuario: UsuarioDTO): Observable<UsuarioDTO> {
    return this.http.post<IResponse<UsuarioDTO>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.usuario.create}`, usuario).pipe(
      map(response => response.data)
    );
  }
}