import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  TipoPagoDTO,
  CrearPagoCreditoRequestDTO
} from '../../../data/models/Entities';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';
import { IResponse } from '../../../data/models/IResponse';
import { HistorialPago, ResumenAlumnoContabilidad } from '../../../shared/models/pagos.model';

@Injectable({
  providedIn: 'root'
})
export class PagoService {

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los tipos de pago
   * Endpoint: /api/TipoPago/GetAllTipoPago
   */
  getTiposPago(): Observable<TipoPagoDTO[]> {
    return this.http.get<IResponse<TipoPagoDTO[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.pagos.tipoPago.getAll}`
    ).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Crear un pago
   * Endpoint: POST /api/Pagos
   * Convierte request anidado (pago + distribuirExcedente) a FormData para enviarlo
   */
  crearPagoCredito(request: any, comprobanteFile?: File): Observable<IResponse<any>> {
    const formData = new FormData();
    const pago = request.pago || request;

    formData.append('IdTipoPago', pago.idTipoPago?.toString() || '');
    formData.append('FechaPago', pago.fechaPago || '');
    formData.append('ValorPago', pago.valorPago?.toString() || '');
    formData.append('FechaDeposito', pago.fechaDeposito || '');
    formData.append('IdCuentaBancaria', pago.idCuentaBancaria?.toString() || '');

    // Default UsuarioRegistro to 1 if not provided, though it's required by backend.
    formData.append('UsuarioRegistro', pago.usuarioRegistro?.toString() || '1');

    if (pago.idCliente) formData.append('IdCliente', pago.idCliente.toString());
    if (pago.numeroDeposito) formData.append('NumeroDeposito', pago.numeroDeposito);
    if (pago.observaciones) formData.append('Observaciones', pago.observaciones);

    formData.append('DistribuirExcedente', request.distribuirExcedente !== undefined ? String(request.distribuirExcedente) : 'true');

    if (comprobanteFile) {
      formData.append('Comprobante', comprobanteFile);
    }

    if (pago.cuotas && Array.isArray(pago.cuotas)) {
      const cuotasFormateadas = pago.cuotas.map((cuota: any) => ({
        IdDetalleCredito: cuota.idDetalleCredito ?? cuota.IdDetalleCredito ?? 0,
        ValorAplicado: cuota.valorAplicado ?? cuota.ValorAplicado ?? 0
      }));
      formData.append('Cuotas', JSON.stringify(cuotasFormateadas));
    }

    return this.http.post<IResponse<any>>(
      `${API_BASE_URL}${API_ENDPOINTS.pagos.pagoCredito.crear}`,
      formData
    );
  }

  /**
   * Obtener historial de pagos por matrícula
   * Endpoint: GET /api/Pagos/historial?IdMatricula={id}
   */
  getHistorialPagos(idMatricula: number): Observable<IResponse<HistorialPago[]>> {
    const params = new HttpParams()
      .set('IdMatricula', String(idMatricula))
      .set('PageNumber', '1')
      .set('PageSize', '1000');

    return this.http.get<IResponse<any>>(
      `${API_BASE_URL}/api/Pagos/historial`,
      { params }
    ).pipe(
      map(response => {
        let items: HistorialPago[] = [];
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            items = response.data;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            items = response.data.items;
          }
        }
        return {
          ...response,
          data: items
        };
      })
    );
  }

  /**
   * Validar un pago
   * Endpoint: PUT /api/Pagos/validar
   */
  validarPago(request: { idPago: number }): Observable<IResponse<any>> {
    return this.http.put<IResponse<any>>(
      `${API_BASE_URL}/api/Pagos/validar`,
      request
    );
  }

  /**
   * Obtener historial completo de pagos (sin filtros)
   * Endpoint: GET /api/Pagos/historial
   */
  getHistorialPagosContabilidad(): Observable<IResponse<any>> {
    return this.http.get<IResponse<any>>(
      `${API_BASE_URL}/api/Pagos/historial?PageSize=1000`
    );
  }

  /**
   * Obtener historial de pagos con filtros opcionales
   * Endpoint: GET /api/Pagos/historial?Documento=&IdMatricula=&FechaDesde=&FechaHasta=&EsValidado=&EstadoPago=&Limite=&PageNumber=&PageSize=
   */
  getHistorialPagosContabilidadFiltrado(filtros: {
    documento?: string;
    idMatricula?: number | null;
    fechaDesde?: string | null;
    fechaHasta?: string | null;
    esValidado?: boolean | null;
    estadoPago?: string | null;
    limite?: number | null;
    pageNumber?: number | null;
    pageSize?: number | null;
  }): Observable<IResponse<any>> {
    let params = new HttpParams();

    if (filtros.documento?.trim()) {
      params = params.set('Documento', filtros.documento.trim());
    }

    if (filtros.idMatricula !== null && filtros.idMatricula !== undefined) {
      params = params.set('IdMatricula', String(filtros.idMatricula));
    }

    // Filtros excluyentes ganando documento: solo si NO hay documento se envían fechas
    if (!filtros.documento?.trim()) {
      if (filtros.fechaDesde) {
        params = params.set('FechaDesde', filtros.fechaDesde);
      }

      if (filtros.fechaHasta) {
        params = params.set('FechaHasta', filtros.fechaHasta);
      }
    }

    if (filtros.esValidado !== null && filtros.esValidado !== undefined) {
      params = params.set('EsValidado', String(filtros.esValidado));
    }

    if (filtros.estadoPago?.trim() && filtros.estadoPago.trim().toUpperCase() !== 'TODOS') {
      params = params.set('EstadoPago', filtros.estadoPago.trim().toUpperCase());
    }

    if (filtros.limite !== null && filtros.limite !== undefined && filtros.limite > 0) {
      params = params.set('Limite', String(filtros.limite));
    }

    if (filtros.pageNumber !== null && filtros.pageNumber !== undefined) {
      params = params.set('PageNumber', String(filtros.pageNumber));
    }

    if (filtros.pageSize !== null && filtros.pageSize !== undefined) {
      params = params.set('PageSize', String(filtros.pageSize));
    }

    return this.http.get<IResponse<any>>(
      `${API_BASE_URL}/api/Pagos/historial`,
      { params }
    );
  }

  /**
   * Cancelar un pago
   * Endpoint: PUT /api/Pagos/cancelar
   */
  cancelarPago(request: { idPago: number; usuarioElimino: number; observaciones: string }): Observable<IResponse<any>> {
    return this.http.put<IResponse<any>>(
      `${API_BASE_URL}/api/Pagos/cancelar`,
      request
    );
  }

  /**
   * Obtener saldo a favor de un alumno
   * Endpoint: GET /api/SaldoFavor/{idPersona}
   */
  getSaldoFavor(idPersona: number): Observable<IResponse<any>> {
    return this.http.get<IResponse<any>>(`${API_BASE_URL}/api/SaldoFavor/${idPersona}`);
  }

  /**
   * Aprobar un pago (Secretaria General)
   * Endpoint: PUT /api/Pagos/aprobar
   */
  aprobarPago(idPago: number, usuarioAprueba: number): Observable<IResponse<any>> {
    return this.http.put<IResponse<any>>(
      `${API_BASE_URL}/api/Pagos/aprobar`,
      { idPago, usuarioAprueba }
    );
  }

  /**
   * Rechazar un pago (Secretaria General)
   * Endpoint: PUT /api/Pagos/rechazar
   */
  rechazarPago(idPago: number, usuarioRechaza: number, observaciones?: string): Observable<IResponse<any>> {
    return this.http.put<IResponse<any>>(
      `${API_BASE_URL}/api/Pagos/rechazar`,
      { idPago, usuarioRechaza, observaciones }
    );
  }

  /**
   * Actualizar o registrar observación en un pago
   * Endpoint: PUT /api/Pagos/actualizar-observacion
   */
  actualizarObservacionPago(idPago: number, observaciones: string): Observable<IResponse<any>> {
    return this.http.put<IResponse<any>>(
      `${API_BASE_URL}/api/Pagos/actualizar-observacion`,
      { idPago, observaciones }
    );
  }

  /**
   * Obtener resumen de alumnos con saldos para contabilidad
   * Endpoint: GET /api/Contabilidad/resumen-alumnos
   */
  getResumenAlumnosContabilidad(filtros: {
    idCiclo: number;
    idCurso?: number | null;
    documento?: string | null;
  }): Observable<ResumenAlumnoContabilidad[]> {
    let params = new HttpParams()
      .set('idCiclo', filtros.idCiclo.toString());

    if (filtros.idCurso != null) {
      params = params.set('idCurso', filtros.idCurso.toString());
    }
    if (filtros.documento?.trim()) {
      params = params.set('documento', filtros.documento.trim());
    }

    return this.http.get<IResponse<ResumenAlumnoContabilidad[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.pagos.contabilidad.resumenAlumnos}`,
      { params }
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
