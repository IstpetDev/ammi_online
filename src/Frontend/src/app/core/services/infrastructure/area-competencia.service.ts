import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AreaCompetenciaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class AreaCompetenciaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las áreas de competencia
  getAll(): Observable<AreaCompetenciaDTO[]> {
    return this.http.get<IResponse<AreaCompetenciaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.areaCompetencia.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener área de competencia por ID
  getById(id: number): Observable<AreaCompetenciaDTO | undefined> {
    return this.getAll().pipe(
      map(areas => areas.find(a => a.idAreaCompetencia === id))
    );
  }

  // Crear una nueva área de competencia
  create(area: AreaCompetenciaDTO): Observable<AreaCompetenciaDTO> {
    return this.http.post<IResponse<AreaCompetenciaDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.areaCompetencia.post}`, area).pipe(
      map(response => response.data)
    );
  }

  // Actualizar un área de competencia
  update(area: AreaCompetenciaDTO): Observable<AreaCompetenciaDTO> {
    return this.http.put<IResponse<AreaCompetenciaDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.areaCompetencia.put}`, area).pipe(
      map(response => response.data)
    );
  }

  // Eliminar un área de competencia por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.areaCompetencia.delete(id)}`);
  }
}