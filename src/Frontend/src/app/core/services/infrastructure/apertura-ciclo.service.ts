import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';
import { ApiResponse, ClonarMallasRequest, ClonarMallasResult } from '../../../data/models/rematricula.model';

@Injectable({
  providedIn: 'root'
})
export class AperturaCicloService {
  constructor(private http: HttpClient) {}

  clonarMallas(payload: ClonarMallasRequest): Observable<ApiResponse<ClonarMallasResult>> {
    return this.http.post<ApiResponse<ClonarMallasResult>>(
      `${API_BASE_URL}${API_ENDPOINTS.infraestructura.mallaCompleta.clonarParaCiclo}`,
      payload
    );
  }
}
