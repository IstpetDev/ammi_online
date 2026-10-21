import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CursoConfigStatus {
  idCurso: number;
  detalle: string;
  idEspecialidad: number;
  idMalla: number | null;
  tieneDetalleMalla: boolean;
  tieneRequisitos: boolean;
  tieneParalelos: boolean;
  tieneEspecies: boolean;
  estado: 'completo' | 'parcial' | 'sin_configurar';
  materiasCount: number;
  requisitosCount: number;
  paralelosCount: number;
  especiesCount: number;
}

export interface CursoConfigRequest {
  idCiclo: number;
  idTipoOferta: number;
  idEspecialidad?: number;
}

export interface CursoConfigResponse {
  isSuccess: boolean;
  data: CursoConfigStatus[];
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class CursoPostulacionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getConfiguracionCursos(request: CursoConfigRequest): Observable<CursoConfigResponse> {
    return this.http.post<CursoConfigResponse>(
      `${this.apiUrl}/api/MallaCompleta/configuracion-cursos`,
      request
    );
  }
}
