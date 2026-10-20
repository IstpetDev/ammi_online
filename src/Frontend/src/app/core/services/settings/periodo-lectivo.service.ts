import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PeriodoLectivoDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class PeriodoLectivoService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los periodos lectivos
  getAll(): Observable<PeriodoLectivoDTO[]> {
    return this.http.get<IResponse<PeriodoLectivoDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.periodosLectivos.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener periodo lectivo por ID
  getById(id: number): Observable<PeriodoLectivoDTO | undefined> {
    return this.getAll().pipe(
      map(periodos => periodos.find(p => p.idPeriodoLectivo === id))
    );
  }

  // Crear un nuevo periodo lectivo
  create(periodo: PeriodoLectivoDTO): Observable<PeriodoLectivoDTO> {
    return this.http.post<IResponse<PeriodoLectivoDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.periodosLectivos.post}`, periodo).pipe(
      map(response => response.data)
    );
  }

  // Actualizar un periodo lectivo
  update(periodo: PeriodoLectivoDTO): Observable<PeriodoLectivoDTO> {
    return this.http.put<IResponse<PeriodoLectivoDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.periodosLectivos.put}`, periodo).pipe(
      map(response => response.data)
    );
  }

  // Eliminar un periodo lectivo por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.periodosLectivos.delete(id)}`);
  }
}