import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';
import { ApiResponse, ReMatriculaInfo, ReMatricularRequest, ReMatricularResult } from '../../../data/models/rematricula.model';

@Injectable({
  providedIn: 'root'
})
export class ReMatriculacionService {
  constructor(private http: HttpClient) {}

  getDiagnostico(numeroDocumento: string, idCicloDestino: number): Observable<ReMatriculaInfo> {
    return this.http.get<ReMatriculaInfo>(
      `${API_BASE_URL}${API_ENDPOINTS.postulaciones.rematriculacion.getInfo(numeroDocumento, idCicloDestino)}`
    );
  }

  reMatricular(payload: ReMatricularRequest): Observable<ApiResponse<ReMatricularResult>> {
    return this.http.post<ApiResponse<ReMatricularResult>>(
      `${API_BASE_URL}${API_ENDPOINTS.postulaciones.rematriculacion.ejecutar}`,
      payload
    );
  }
}
