import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CursoDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class CursoService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los cursos
  getAll(): Observable<CursoDTO[]> {
    return this.http.get<IResponse<CursoDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.curso.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener curso por ID
  getById(id: number): Observable<CursoDTO | undefined> {
    return this.getAll().pipe(
      map(cursos => cursos.find(c => c.idCursos === id))
    );
  }

  // Crear un nuevo curso
  create(curso: CursoDTO): Observable<CursoDTO> {
    return this.http.post<IResponse<CursoDTO>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.curso.create}`, curso).pipe(
      map(response => response.data)
    );
  }

  // Actualizar un curso
  update(curso: CursoDTO): Observable<CursoDTO> {
    return this.http.put<IResponse<CursoDTO>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.curso.update}`, curso).pipe(
      map(response => response.data)
    );
  }

  // Eliminar un curso por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.curso.delete(id)}`);
  }
}