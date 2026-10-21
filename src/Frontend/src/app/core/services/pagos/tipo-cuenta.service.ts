import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TipoCuentaDTO } from '../../../data/models/Entities';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TipoCuentaService {

  constructor(private http: HttpClient) { }

  /** GET /api/TipoCuenta/GetTipoCuenta */
  getAll(): Observable<TipoCuentaDTO[]> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.tipoCuenta.getAll}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.data) return response.data as TipoCuentaDTO[];
        if (Array.isArray(response)) return response as TipoCuentaDTO[];
        return [];
      })
    );
  }
}
