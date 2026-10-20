import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { 
  TipoPagoDTO, 
  PagoCreditoDTO, 
  CrearPagoCreditoRequestDTO
} from '../../../data/models/Entities';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';
import { IResponse } from '../../../data/models/IResponse';

@Injectable({
  providedIn: 'root'
})
export class PagoService {

  constructor(private http: HttpClient) { }

  // ============================================
  // MÉTODOS REALES (API Backend)
  // ============================================

  /**
   * Obtener todos los tipos de pago desde el API
   * Endpoint: /api/TipoPago/GetAllTipoPago
   */
  getTiposPago(): Observable<TipoPagoDTO[]> {
    return this.http.get<IResponse<TipoPagoDTO[]>>(`${API_BASE_URL}${API_ENDPOINTS.pagos.tipoPago.getAll}`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Crear un pago de crédito
   * Endpoint: /api/Pagos
   */
  crearPagoCredito(request: CrearPagoCreditoRequestDTO): Observable<IResponse<number>> {
    return this.http.post<IResponse<number>>(
      `${API_BASE_URL}${API_ENDPOINTS.pagos.pagoCredito.crear}`, 
      request
    );
  }

  /**
   * Obtener pagos realizados a un crédito
   * Endpoint: /api/PagoCredito/GetPagosByCredito/{idCredito}
   */
  getPagosByCredito(idCredito: number): Observable<PagoCreditoDTO[]> {
    return this.http.get<IResponse<PagoCreditoDTO[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.pagos.pagoCredito.getByCredito(idCredito)}`
    ).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }
}
