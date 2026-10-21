import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CreditoConDetallesDTO,
  DetalleCreditoDTO,
  DiferirCreditoRequestDTO
} from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class CreditoService {

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los detalles de crédito por matrícula
   * Endpoint: /api/Credito/GetDetallesCreditoByMatricula/GetDetallesCreditoByMatricula/{idMatricula}
   * Usado para el cálculo de progreso en la lista de estudiantes
   */
  getDetallesCreditoByMatricula(idMatricula: number): Observable<DetalleCreditoDTO[]> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.detalleCredito.getByMatricula(idMatricula)}`;
    return this.http.get<IResponse<DetalleCreditoDTO[]>>(url).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Obtener créditos con detalles completos por matrícula
   * Endpoint: /api/Credito/GetCreditosByMatricula/GetCreditosByMatricula/{idMatricula}
   * Fuente principal de datos para el panel de detalle de estudiante
   */
  getCreditosConDetallesByMatricula(idMatricula: number): Observable<CreditoConDetallesDTO[]> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.credito.getCreditosConDetalles(idMatricula)}`;
    return this.http.get<IResponse<CreditoConDetallesDTO[]>>(url).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Diferir un crédito en cuotas
   * Endpoint: /api/Credito/DiferirCredito/Diferir
   */
  diferirCredito(request: DiferirCreditoRequestDTO): Observable<IResponse<any>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.credito.diferirCredito}`;
    return this.http.post<IResponse<any>>(url, request);
  }

  actualizarFechaLimiteCuota(idDetalleCredito: number, nuevaFechaLimite: string): Observable<IResponse<boolean>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.detalleCredito.actualizarFechaLimite(idDetalleCredito)}`;
    return this.http.patch<IResponse<boolean>>(url, { nuevaFechaLimite });
  }

  asignarCreditoExtra(data: { idMatricula: number; idEspecie: number; monto: number; fechaLimite?: string | null; observaciones?: string | null }): Observable<IResponse<any>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.credito.asignarCreditoExtra}`;
    return this.http.post<IResponse<any>>(url, data);
  }

  asignarCreditoExtraMasivo(data: { idsMallas: number[]; idEspecie: number; monto: number; fechaLimite?: string | null; observaciones?: string | null }): Observable<IResponse<{ totalMatriculasEvaluadas: number; totalAsignados: number; totalOmitidosDuplicados: number; mensaje: string }>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.credito.asignarCreditoExtraMasivo}`;
    return this.http.post<IResponse<{ totalMatriculasEvaluadas: number; totalAsignados: number; totalOmitidosDuplicados: number; mensaje: string }>>(url, data);
  }

  anularCreditoExtra(idCredito: number): Observable<IResponse<boolean>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.credito.anularCreditoExtra(idCredito)}`;
    return this.http.delete<IResponse<boolean>>(url);
  }

  getCreditosExtras(idMatricula?: number): Observable<IResponse<any[]>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.credito.getCreditosExtras(idMatricula)}`;
    return this.http.get<IResponse<any[]>>(url);
  }
}
