import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RequisitoDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class RequisitosService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los requisitos
  getAll(): Observable<RequisitoDTO[]> {
    return this.http.get<RequisitoDTO[]>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.requisitos.getAll}`);
  }

  // Obtener requisito por ID
  getById(id: number): Observable<RequisitoDTO | undefined> {
    return this.getAll().pipe(
      map(requisitos => requisitos.find(r => r.idRequisitos === id))
    );
  }

  private unwrapData<T>(response: any): T | null {
    if (response == null) return null;
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as IResponse<T>).data ?? null;
    }
    return response as T;
  }

  // Crear un nuevo requisito
  create(requisito: RequisitoDTO): Observable<RequisitoDTO> {
    return this.http.post<any>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.requisitos.create}`, requisito).pipe(
      map(response => this.unwrapData<RequisitoDTO>(response) as RequisitoDTO)
    );
  }

  getByMalla(idMalla: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallaRequisitos.getByMalla(idMalla)}`).pipe(
      map(response => Array.isArray(response) ? response : response?.data ?? [])
    );
  }

  asignarRequisitosAMalla(mallaId: number, requisitoIds: number[]): Observable<void> {
    const payload = {
      idMalla: mallaId,
      idsRequisitos: requisitoIds
    };
    return this.http.post<void>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallaRequisitos.asignacionMasica}`, payload);
  }

  // Actualizar un requisito
  update(requisito: RequisitoDTO): Observable<RequisitoDTO> {
    return this.http.put<any>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.requisitos.update}`, requisito).pipe(
      map(response => this.unwrapData<RequisitoDTO>(response) as RequisitoDTO)
    );
  }

  // Eliminar un requisito por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.requisitos.delete(id)}`);
  }
}