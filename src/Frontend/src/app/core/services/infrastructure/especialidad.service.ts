import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { EspecialidadDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las especialidades
  getAll(): Observable<EspecialidadDTO[]> {
    return this.http.get<IResponse<EspecialidadDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.especialidad.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener especialidad por ID
  getById(id: number): Observable<EspecialidadDTO | undefined> {
    return this.getAll().pipe(
      map(especialidades => especialidades.find(e => e.idEspecialidad === id))
    );
  }

  // Crear una nueva especialidad
  create(especialidad: EspecialidadDTO): Observable<EspecialidadDTO> {
    return this.http.post<IResponse<EspecialidadDTO>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.especialidad.create}`, especialidad).pipe(
      map(response => response.data)
    );
  }

  // Actualizar una especialidad
  update(especialidad: EspecialidadDTO): Observable<EspecialidadDTO> {
    return this.http.put<IResponse<EspecialidadDTO>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.especialidad.update}`, especialidad).pipe(
      map(response => response.data)
    );
  }

  // Eliminar una especialidad por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.especialidad.delete(id)}`);
  }
}