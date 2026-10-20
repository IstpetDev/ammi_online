import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RegimenDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class RegimenService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los regimenes
  getAll(): Observable<RegimenDTO[]> {
    return this.http.get<IResponse<RegimenDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.regimen.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener regimen por ID
  getById(id: number): Observable<RegimenDTO | undefined> {
    return this.getAll().pipe(
      map(regimenes => regimenes.find(r => r.idRegimen === id))
    );
  }

  // Crear un nuevo regimen
  create(regimen: RegimenDTO): Observable<RegimenDTO> {
    return this.http.post<IResponse<RegimenDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.regimen.post}`, regimen).pipe(
      map(response => response.data)
    );
  }

  // Actualizar un regimen
  update(regimen: RegimenDTO): Observable<RegimenDTO> {
    return this.http.put<IResponse<RegimenDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.regimen.put}`, regimen).pipe(
      map(response => response.data)
    );
  }

  // Eliminar un regimen por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.regimen.delete(id)}`);
  }

  
}