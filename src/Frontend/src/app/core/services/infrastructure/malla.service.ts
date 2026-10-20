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

  // Obtener todas las mallas
  getAll(): Observable<MallaDTO[]> {
    return this.http.get<MallaDTO[]>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallas.getAll}`);
  }

  // Obtener malla por ID
  getById(id: number): Observable<MallaDTO | undefined> {
    return this.getAll().pipe(
      map(mallas => mallas.find(m => m.idMalla === id))
    );
  }

  // Crear una nueva malla
  create(malla: MallaDTO): Observable<MallaDTO> {
    return this.http.post<IResponse<MallaDTO>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallas.create}`, malla).pipe(
      map(response => response.data)
    );
  }

  // Actualizar una malla
  update(malla: MallaDTO): Observable<MallaDTO> {
    return this.http.put<IResponse<MallaDTO>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallas.update}`, malla).pipe(
      map(response => response.data)
    );
  }

  // Eliminar una malla por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallas.delete(id)}`);
  }
}