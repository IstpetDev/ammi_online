import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IResponse } from '../../../data/models/IResponse';
import { CuentaBancariaDTO } from '../../../data/models/Entities';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class CuentaBancariaService {

  constructor(private http: HttpClient) { }

  /** GET /api/CuentaBancaria/GetCuentaBancaria */
  getAll(): Observable<CuentaBancariaDTO[]> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.cuentaBancaria.getAll}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.data) return response.data as CuentaBancariaDTO[];
        if (Array.isArray(response)) return response as CuentaBancariaDTO[];
        return [];
      })
    );
  }

  /** POST /api/CuentaBancaria/CreateCuentaBancaria */
  create(data: CuentaBancariaDTO): Observable<CuentaBancariaDTO> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.cuentaBancaria.create}`;
    const body = { cuentaBancaria: data };
    return this.http.post<IResponse<CuentaBancariaDTO>>(url, body).pipe(
      map(r => r.data!)
    );
  }

  /** PUT /api/CuentaBancaria/UpdateCuentaBancaria */
  update(data: CuentaBancariaDTO): Observable<CuentaBancariaDTO> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.cuentaBancaria.update}`;
    const body = { cuentaBancaria: data };
    return this.http.put<IResponse<CuentaBancariaDTO>>(url, body).pipe(
      map(r => r.data!)
    );
  }

  /** DELETE /api/CuentaBancaria/DeactivateCuentaBancaria/{id}/desactivar */
  delete(id: number): Observable<void> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.cuentaBancaria.delete(id)}`;
    return this.http.delete<void>(url);
  }
}
