import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, concatMap, from, toArray } from 'rxjs';
import { IResponse } from '../../../data/models/IResponse';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';

export interface EspecieCicloInput {
  idEspecie: number;
  valorEspecie: number;
}

// Compatibilidad con flujo existente de clonado masivo
export interface DuplicarMallaCompletaRequest {
  idMallaOrigen: number;
  idCicloDestino: number;
  especies?: EspecieCicloInput[];
}

export interface DuplicarMallaCompletaResult {
  idMallaOrigen: number;
  idMallaDestino: number;
  idCicloDestino: number;
  totalDetalleMalla: number;
  totalRequisitos: number;
  idsEspecieCiclo: number[];
  resumen: string;
}

// Flujo nuevo de creación completa
export interface DetalleMallaInput {
  idMateria: number;
  idPlantillaEvaluacion: number;
  idAreaCompetencia: number;
  modulo?: number | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  duracionHoras?: number | null;
}

export interface CicloInput {
  idPeriodo: number;
  idRegimen: number;
  idTipoOferta?: number;
  idPadre?: number | null;
  detalle: string;
  fechaInicioEstimada: string;
  fechaFinEstimada: string;
}

export interface MallaInput {
  detalle: string;
  idCursos: number;
}

export interface ParaleloInput {
  idParalelo: number;
  cupoMaximo?: number | null;
}

export interface CrearMallaCompletaRequest {
  crearCiclo: boolean; // true = crear nuevo, false = usar existente
  idCiclo: number; // usado cuando crearCiclo = false
  nuevoCiclo?: CicloInput | null; // usado cuando crearCiclo = true
  malla: MallaInput;
  idsRequisitos: number[];
  materias: DetalleMallaInput[];
  especies: EspecieCicloInput[];
  paralelo?: ParaleloInput | null;
}

export interface CrearMallaCompletaResult {
  idPeriodoLectivo: number;
  idRegimen: number;
  idCiclo: number;
  idMalla: number;
  idsMallaRequisitos: number[];
  idsDetalleMalla: number[];
  idsEspecieCiclo: number[];
  idMallaParalelo: number | null;
  idsDistributivo: number[];
  resumen: string;
}

export interface DuplicarMallaRequest {
  idMallaOrigen: number;
  idCicloDestino: number;
  especies?: EspecieCicloInput[];
}

export interface DuplicarMallaResult {
  idMallaOrigen: number;
  idMallaDestino: number;
  idCicloDestino: number;
  totalDetalleMalla: number;
  totalRequisitos: number;
  idsEspecieCiclo: number[];
  resumen: string;
}

@Injectable({
  providedIn: 'root'
})
export class MallaCompletaService {
  constructor(private http: HttpClient) {}

  // Compatibilidad con componentes existentes
  clonarMallaCompleta(request: DuplicarMallaCompletaRequest): Observable<IResponse<DuplicarMallaCompletaResult>> {
    return this.http.post<IResponse<DuplicarMallaCompletaResult>>(
      `${API_BASE_URL}${API_ENDPOINTS.infraestructura.mallaCompleta.duplicar}`,
      request
    );
  }

  clonarMallasSecuencial(
    requests: DuplicarMallaCompletaRequest[]
  ): Observable<IResponse<DuplicarMallaCompletaResult>[]> {
    return from(requests).pipe(
      concatMap((request) => this.clonarMallaCompleta(request)),
      toArray()
    );
  }

  construirRequestClonado(
    idMallaOrigen: number,
    idCicloDestino: number,
    especies?: EspecieCicloInput[]
  ): DuplicarMallaCompletaRequest {
    return {
      idMallaOrigen,
      idCicloDestino,
      ...(especies && especies.length > 0 ? { especies } : {})
    };
  }

  // Flujo nuevo
  crear(request: CrearMallaCompletaRequest): Observable<IResponse<CrearMallaCompletaResult>> {
    return this.http.post<IResponse<CrearMallaCompletaResult>>(
      `${API_BASE_URL}${API_ENDPOINTS.infraestructura.mallaCompleta.crear}`,
      request
    );
  }

  duplicar(request: DuplicarMallaRequest): Observable<IResponse<DuplicarMallaResult>> {
    return this.http.post<IResponse<DuplicarMallaResult>>(
      `${API_BASE_URL}${API_ENDPOINTS.infraestructura.mallaCompleta.duplicar}`,
      request
    );
  }
}
