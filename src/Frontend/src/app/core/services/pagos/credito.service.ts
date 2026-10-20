import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { 
  CreditoDTO, 
  DetalleCreditoDTO, 
  CreditoPendienteDTO,
  EspecieDTO,
  EspecieCicloDTO,
  CreditoConDetallesDTO,
  DiferirCreditoRequestDTO
} from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class CreditoService {

  // ============================================
  // DATOS MOCK - Simulando datos de tu backend
  // ============================================

  // Especies (tipos de cobro)
  private mockEspecies: EspecieDTO[] = [
    { idEspecie: 1, detalle: 'Matrícula', esDiferible: false },
    { idEspecie: 2, detalle: 'Pensión', esDiferible: true }
  ];

  // Especie por Ciclo (valores)
  private mockEspecieCiclos: EspecieCicloDTO[] = [
    { idEspecieCiclo: 1, idCiclo: 1, idEspecie: 1, valorEspecie: 150.00 }, // Matrícula ciclo 1
    { idEspecieCiclo: 2, idCiclo: 1, idEspecie: 2, valorEspecie: 500.00 }  // Pensión ciclo 1
  ];

  // Créditos (según tus datos: 2 créditos en base)
  // Crédito 1: id=1, id_matricula=1, id_especie_ciclo=1, diferido=1 (matrícula, 1 cuota)
  // Crédito 2: id=2, id_matricula=1, id_especie_ciclo=2, diferido=5 (pensión, 5 cuotas)
  private mockCreditos: CreditoDTO[] = [
    { 
      idCredito: 1, 
      idMatricula: 1, 
      idEspecieCiclo: 1, 
      diferido: 1 
    },
    { 
      idCredito: 2, 
      idMatricula: 1, 
      idEspecieCiclo: 2, 
      diferido: 5 
    }
  ];

  // Detalles de Crédito (cuotas)
  private mockDetallesCredito: DetalleCreditoDTO[] = [
    // Crédito 1: Matrícula (1 cuota de $150)
    { 
      idDetalleCredito: 1, 
      idCredito: 1, 
      valor: 150.00, 
      valorCancelado: 0, 
      fechaLimite: '2026-02-15', 
      pagado: false, 
      fechaPago: undefined 
    },
    // Crédito 2: Pensión (5 cuotas de $100 cada una = $500 total)
    { 
      idDetalleCredito: 2, 
      idCredito: 2, 
      valor: 100.00, 
      valorCancelado: 0, 
      fechaLimite: '2026-02-28', 
      pagado: false, 
      fechaPago: undefined 
    },
    { 
      idDetalleCredito: 3, 
      idCredito: 2, 
      valor: 100.00, 
      valorCancelado: 0, 
      fechaLimite: '2026-03-31', 
      pagado: false, 
      fechaPago: undefined 
    },
    { 
      idDetalleCredito: 4, 
      idCredito: 2, 
      valor: 100.00, 
      valorCancelado: 0, 
      fechaLimite: '2026-04-30', 
      pagado: false, 
      fechaPago: undefined 
    },
    { 
      idDetalleCredito: 5, 
      idCredito: 2, 
      valor: 100.00, 
      valorCancelado: 0, 
      fechaLimite: '2026-05-31', 
      pagado: false, 
      fechaPago: undefined 
    },
    { 
      idDetalleCredito: 6, 
      idCredito: 2, 
      valor: 100.00, 
      valorCancelado: 0, 
      fechaLimite: '2026-06-30', 
      pagado: false, 
      fechaPago: undefined 
    }
  ];

  // Datos de estudiantes mock (para mostrar info)
  private mockEstudiantes = [
    { idMatricula: 1, nombre: 'Juan Carlos Pérez García', documento: '1234567890' }
  ];

  constructor(private http: HttpClient) { }

  // ============================================
  // MÉTODOS MOCK (usar mientras no hay backend)
  // ============================================

  /**
   * Obtener todas las especies
   */
  getEspecies(): Observable<EspecieDTO[]> {
    // Cuando tengas backend:
    // return this.http.get<EspecieDTO[]>(`${API_BASE_URL}${API_ENDPOINTS.pagos.especie.getAll}`);
    return of(this.mockEspecies);
  }

  /**
   * Obtener todos los créditos
   */
  getAllCreditos(): Observable<CreditoDTO[]> {
    // Cuando tengas backend:
    // return this.http.get<CreditoDTO[]>(`${API_BASE_URL}${API_ENDPOINTS.pagos.credito.getAll}`);
    return of(this.mockCreditos);
  }

  /**
   * Obtener crédito por ID
   */
  getCreditoById(idCredito: number): Observable<CreditoDTO | undefined> {
    // Cuando tengas backend:
    // return this.http.get<CreditoDTO>(`${API_BASE_URL}${API_ENDPOINTS.pagos.credito.getById(idCredito)}`);
    const credito = this.mockCreditos.find(c => c.idCredito === idCredito);
    return of(credito);
  }

  /**
   * Obtener créditos por matrícula
   */
  getCreditosByMatricula(idMatricula: number): Observable<CreditoDTO[]> {
    // Cuando tengas backend:
    // return this.http.get<CreditoDTO[]>(`${API_BASE_URL}${API_ENDPOINTS.pagos.credito.getByMatricula(idMatricula)}`);
    const creditos = this.mockCreditos.filter(c => c.idMatricula === idMatricula);
    return of(creditos);
  }

  /**
   * Buscar créditos por documento del estudiante
   */
  getCreditosByDocumento(documento: string): Observable<CreditoPendienteDTO[]> {
    // Cuando tengas backend:
    // return this.http.get<CreditoPendienteDTO[]>(`${API_BASE_URL}${API_ENDPOINTS.pagos.credito.getByDocumento(documento)}`);
    
    // Buscar estudiante por documento
    const estudiante = this.mockEstudiantes.find(e => e.documento === documento);
    if (!estudiante) {
      return of([]);
    }

    // Obtener créditos del estudiante
    const creditos = this.mockCreditos.filter(c => c.idMatricula === estudiante.idMatricula);
    
    // Construir vista de créditos pendientes
    const creditosPendientes: CreditoPendienteDTO[] = creditos.map(credito => {
      const especieCiclo = this.mockEspecieCiclos.find(ec => ec.idEspecieCiclo === credito.idEspecieCiclo);
      const especie = this.mockEspecies.find(e => e.idEspecie === especieCiclo?.idEspecie);
      const detalles = this.mockDetallesCredito.filter(d => d.idCredito === credito.idCredito);
      
      const valorTotal = detalles.reduce((sum, d) => sum + (d.valor || 0), 0);
      const valorPagado = detalles.reduce((sum, d) => sum + (d.valorCancelado || 0), 0);
      const cuotasPagadas = detalles.filter(d => d.pagado).length;

      return {
        idCredito: credito.idCredito,
        nombreEstudiante: estudiante.nombre,
        documento: estudiante.documento,
        especie: especie?.detalle,
        ciclo: 'Ciclo 1 - 2026', // Esto vendría del backend
        valorTotal: valorTotal,
        valorPagado: valorPagado,
        valorPendiente: valorTotal - valorPagado,
        numeroCuotas: credito.diferido,
        cuotasPagadas: cuotasPagadas,
        cuotasPendientes: (credito.diferido || 0) - cuotasPagadas,
        detalles: detalles
      };
    });

    return of(creditosPendientes);
  }

  /**
   * Obtener detalles de crédito por ID de crédito
   */
  getDetallesByCredito(idCredito: number): Observable<DetalleCreditoDTO[]> {
    // Cuando tengas backend:
    // return this.http.get<DetalleCreditoDTO[]>(`${API_BASE_URL}${API_ENDPOINTS.pagos.detalleCredito.getByCredito(idCredito)}`);
    const detalles = this.mockDetallesCredito.filter(d => d.idCredito === idCredito);
    return of(detalles);
  }

  /**
   * Obtener detalles pendientes de un crédito
   */
  getDetallesPendientes(idCredito: number): Observable<DetalleCreditoDTO[]> {
    // Cuando tengas backend:
    // return this.http.get<DetalleCreditoDTO[]>(`${API_BASE_URL}${API_ENDPOINTS.pagos.detalleCredito.getPendientes(idCredito)}`);
    const detalles = this.mockDetallesCredito.filter(d => d.idCredito === idCredito && !d.pagado);
    return of(detalles);
  }

  /**
   * Actualizar detalle de crédito localmente (mock)
   * En producción esto se haría en el backend
   */
  actualizarDetalleCreditoLocal(idDetalleCredito: number, valorCancelado: number, pagado: boolean, fechaPago: string): void {
    const detalle = this.mockDetallesCredito.find(d => d.idDetalleCredito === idDetalleCredito);
    if (detalle) {
      detalle.valorCancelado = (detalle.valorCancelado || 0) + valorCancelado;
      detalle.pagado = pagado;
      if (pagado) {
        detalle.fechaPago = fechaPago;
      }
    }
  }

  // ============================================
  // MÉTODOS REALES (API Backend)
  // ============================================

  /**
   * Obtener todos los detalles de crédito por matrícula
   * Endpoint: /api/Credito/GetDetallesCreditoByMatricula/GetDetallesCreditoByMatricula/{idMatricula}
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
}
