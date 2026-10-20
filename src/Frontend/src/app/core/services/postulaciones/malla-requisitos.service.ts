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
  getMallaRequisitos(): Observable<MallaRequisitosDTO[]> {
    return this.http.get<IResponse<MallaRequisitosDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.mallaRequisitos.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener malla requisito por ID
  getMallaRequisitoById(id: number): Observable<MallaRequisitosDTO | undefined> {
    return this.getMallaRequisitos().pipe(
      map(mallaRequisitos => mallaRequisitos.find(m => m.idMallaRequisitos === id))
    );
  }

  // Obtener malla requisitos por malla
  getMallaRequisitosByMalla(idMalla: number): Observable<MallaRequisitosDTO[]> {
    return this.getMallaRequisitos().pipe(
      map(mallaRequisitos => mallaRequisitos.filter(m => m.idMalla === idMalla))
    );
  }
}