import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatriculaDTO, ParaleloDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ParaleloService {
    private apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los paralelos disponibles
   * Endpoint: /api/Paralelo
   */



  getAllParalelos(): Observable<ParaleloDTO[]> {
    return this.http.get<IResponse<ParaleloDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.paralelo.getAll}`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Obtener paralelo por ID
   * Endpoint: /api/Paralelo/GetParalelo?IdParalelo={id}
   */
  getParaleloById(id: number): Observable<ParaleloDTO | null> {
    return this.http.get<IResponse<ParaleloDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.paralelo.getAll}?IdParalelo=${id}`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }
}
