import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MallaRequisitosDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class MallaRequisitosService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los malla requisitos
  getAll(): Observable<MallaRequisitosDTO[]> {
    return this.http.get<MallaRequisitosDTO[]>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallaRequisitos.getAll}`);
  }

  // Obtener malla requisito por ID
  getById(id: number): Observable<MallaRequisitosDTO | undefined> {
    return this.getAll().pipe(
      map(mallaRequisitos => mallaRequisitos.find(mr => mr.idMallaRequisitos === id))
    );
  }

  // Crear un nuevo malla requisito
  create(mallaRequisito: MallaRequisitosDTO): Observable<MallaRequisitosDTO> {
    return this.http.post<MallaRequisitosDTO>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallaRequisitos.create}`, mallaRequisito);
  }

  // Eliminar un malla requisito por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.mallaRequisitos.delete(id)}`);
  }
}