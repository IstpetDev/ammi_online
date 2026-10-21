
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CicloDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class CicloService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los ciclos
  getAll(): Observable<CicloDTO[]> {
    return this.http.get<IResponse<CicloDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.ciclo.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener solo ciclos activos
  getActivos(): Observable<CicloDTO[]> {
    return this.http.get<IResponse<CicloDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.ciclo.getAll}?EsActivo=true`).pipe(
      map(response => response.data)
    );
  }

  // Obtener ciclo por ID
  getById(id: number): Observable<CicloDTO | undefined> {
    return this.getAll().pipe(
      map(ciclos => ciclos.find(c => c.idCiclo === id))
    );
  }

  // Obtener ciclos filtrados por régimen y período
  getByRegimenAndPeriodo(idRegimen: number, idPeriodo: number): Observable<CicloDTO[]> {
    const url = `${this.apiUrl}${API_ENDPOINTS.postulaciones.ciclo.getAll}?IdRegimen=${idRegimen}&IdPeriodo=${idPeriodo}`;
    return this.http.get<IResponse<CicloDTO[]>>(url).pipe(
      map(response => response.data)
    );
  }

  // Obtener ciclos filtrados por período
  getByPeriodo(idPeriodo: number): Observable<CicloDTO[]> {
    const url = `${this.apiUrl}${API_ENDPOINTS.postulaciones.ciclo.getAll}?IdPeriodo=${idPeriodo}`;
    return this.http.get<IResponse<CicloDTO[]>>(url).pipe(
      map(response => response.data)
    );
  }

  // Crear un nuevo ciclo
  create(ciclo: CicloDTO): Observable<CicloDTO> {
    return this.http.post<IResponse<CicloDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.ciclo.post}`, ciclo).pipe(
      map(response => response.data)
    );
  }

  // Actualizar un ciclo
  update(ciclo: CicloDTO): Observable<CicloDTO> {
    return this.http.put<IResponse<CicloDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.ciclo.put}`, ciclo).pipe(
      map(response => response.data)
    );
  }

  // Eliminar un ciclo por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.ciclo.delete(id)}`);
  }
  // Desactivar ciclo
  deactivate(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.ciclo.desactivate(id)}`);
  }

  // Reactivar ciclo (edit directo)
  reactivate(ciclo: CicloDTO): Observable<CicloDTO> {
    return this.update(ciclo);
  }
}
