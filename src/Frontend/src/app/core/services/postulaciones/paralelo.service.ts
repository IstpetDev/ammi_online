import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ParaleloDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class ParaleloService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los paralelos
  getParalelos(): Observable<ParaleloDTO[]> {
    return this.http.get<IResponse<ParaleloDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.paralelo.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener paralelo por ID
  getParaleloById(id: number): Observable<ParaleloDTO | undefined> {
    return this.getParalelos().pipe(
      map(paralelos => paralelos.find(p => p.idParalelo === id))
    );
  }
}