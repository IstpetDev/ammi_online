import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IResponse } from '../../../data/models/IResponse';
import { BeneficioDTO } from '../../../data/models/Entities';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class BeneficioService {

  constructor(private http: HttpClient) { }

  /** GET /api/Beneficio */
  getAll(): Observable<BeneficioDTO[]> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.beneficio.getAll}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.data) return response.data as BeneficioDTO[];
        if (Array.isArray(response)) return response as BeneficioDTO[];
        return [];
      })
    );
  }

  /** GET /api/Beneficio/ByEspecie?idEspecie=... */
  getByEspecie(idEspecie: number): Observable<BeneficioDTO[]> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.beneficio.getByIdEspecie(idEspecie)}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.data) return response.data as BeneficioDTO[];
        if (Array.isArray(response)) return response as BeneficioDTO[];
        return [];
      })
    );
  }

  /** POST /api/Beneficio */
  create(data: BeneficioDTO): Observable<BeneficioDTO> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.beneficio.create}`;
    return this.http.post<IResponse<BeneficioDTO>>(url, data).pipe(
      map(r => r.data!)
    );
  }

  /** PUT /api/Beneficio */
  update(data: BeneficioDTO): Observable<BeneficioDTO> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.beneficio.update}`;
    return this.http.put<IResponse<BeneficioDTO>>(url, data).pipe(
      map(r => r.data!)
    );
  }

  /** DELETE /api/Beneficio/{id} */
  delete(id: number): Observable<void> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.beneficio.delete(id)}`;
    return this.http.delete<void>(url);
  }
}
