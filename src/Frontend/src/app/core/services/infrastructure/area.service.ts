import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AreaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class AreaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las áreas
  getAll(): Observable<AreaDTO[]> {
    return this.http.get<IResponse<AreaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.area.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener área por ID
  getById(id: number): Observable<AreaDTO | undefined> {
    return this.getAll().pipe(
      map(areas => areas.find(a => a.idArea === id))
    );
  }

  // Crear una nueva área
  create(area: AreaDTO): Observable<AreaDTO> {
    return this.http.post<IResponse<AreaDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.area.post}`, area).pipe(
      map(response => response.data)
    );
  }

  // Actualizar un área
  update(area: AreaDTO): Observable<AreaDTO> {
    return this.http.put<IResponse<AreaDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.area.put}`, area).pipe(
      map(response => response.data)
    );
  }

  // Eliminar un área por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.area.delete(id)}`);
  }
}

