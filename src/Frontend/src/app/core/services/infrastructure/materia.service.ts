import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MateriaDTO, PaginatedMateriaResponse } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class MateriaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las materias
  getAll(pageSize: number = 100): Observable<PaginatedMateriaResponse> {
    return this.http.get<IResponse<PaginatedMateriaResponse>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.materia.getAll}?PageSize=${100}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener materia por ID
  getById(id: number): Observable<MateriaDTO | undefined> {
    return this.getAll().pipe(
      map(response => response.items?.find((m: MateriaDTO) => m.idMateria === id))
    );
  }

  // Crear una nueva materia
  create(materia: MateriaDTO): Observable<MateriaDTO> {
    return this.http.post<IResponse<MateriaDTO>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.materia.create}`, materia).pipe(
      map(response => response.data)
    );
  }

  // Actualizar una materia
  update(materia: MateriaDTO): Observable<MateriaDTO> {
    return this.http.put<IResponse<MateriaDTO>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.materia.update}`, materia).pipe(
      map(response => response.data)
    );
  }

  // Eliminar una materia por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.materia.delete(id)}`);
  }
}