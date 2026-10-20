import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IResponse } from '../../../data/models/IResponse';
import {
  DistributivoDTO,
  DistributivoCreateDTO,
  DistributivoUpdateDTO,
  DistributivoMasivoDTO,
  AsignacionDocenteDTO,
  CargaDocenteDTO,
  DocenteDisponibleDTO
} from '../../../data/models/distributivo/distributivo.model';

@Injectable({
  providedIn: 'root'
})
export class DistributivoService {
  private apiUrl = `${environment.apiUrl}/Distributivo`;

  constructor(private http: HttpClient) {}

  /**
   * Helper para validar respuesta del backend
   */
  private validateResponse<T>(response: IResponse<T>): T {
    if (!response.isSuccess) {
      throw new Error(response.message || 'Error en la operación');
    }
    return response.data as T;
  }

  /**
   * Obtener todos los distributivos (con información de plantilla para admin)
   */
  getAll(): Observable<DistributivoDTO[]> {
    return this.http.get<IResponse<any[]>>(this.apiUrl)
      .pipe(map(r => {
        const data = r.data || [];
        // Mapear para incluir información de plantilla si está disponible
        return data.map((d: any) => ({
          ...d,
          idPlantillaEvaluacion: d.idPlantillaEvaluacion || 0,
          nombrePlantilla: d.nombrePlantilla || ''
        }));
      }));
  }

  /**
   * Obtener distributivo por ID
   */
  getById(id: number): Observable<DistributivoDTO | null> {
    return this.http.get<IResponse<DistributivoDTO>>(`${this.apiUrl}/${id}`)
      .pipe(map(r => r.data || null));
  }

  /**
   * Obtener distributivos por docente (todas las asignaciones)
   */
  getByDocente(idPersona: number): Observable<DistributivoDTO[]> {
    return this.http.get<IResponse<DistributivoDTO[]>>(
      `${this.apiUrl}/ByDocente/${idPersona}`
    ).pipe(map(r => r.data || []));
  }

  /**
   * Obtener asignaciones de un docente con datos completos para calificaciones
   * Este endpoint retorna la informacion necesaria para el componente de calificaciones
   */
  getAsignacionesByDocente(idPersona: number): Observable<AsignacionDocenteDTO[]> {
    return this.http.get<IResponse<AsignacionDocenteDTO[]>>(
      `${this.apiUrl}/ByDocente/${idPersona}`
    ).pipe(map(r => {
      // Mapear a AsignacionDocenteDTO si el backend retorna DistributivoDTO
      const data = r.data || [];
      return data.map((d: any) => ({
        idDistributivo: d.idDistributivo,
        idDetalleMalla: d.idDetalleMalla,
        idParalelo: d.idParalelo,
        nombreMateria: d.nombreMateria || '',
        nombreParalelo: d.nombreParalelo || '',
        idPlantillaEvaluacion: d.idPlantillaEvaluacion || 0,
        nombrePlantilla: d.nombrePlantilla || '',
        cantidadAlumnos: d.cantidadAlumnos || 0,
        idMalla: d.idMalla || 0,
        nombreMalla: d.nombreMalla || ''
      }));
    }));
  }

  /**
   * Obtener distributivos por malla
   */
  getByMalla(idMalla: number): Observable<DistributivoDTO[]> {
    return this.http.get<IResponse<DistributivoDTO[]>>(
      `${this.apiUrl}/ByMalla/${idMalla}`
    ).pipe(map(r => r.data || []));
  }

  /**
   * Obtener distributivos por paralelo
   */
  getByParalelo(idParalelo: number): Observable<DistributivoDTO[]> {
    return this.http.get<IResponse<DistributivoDTO[]>>(
      `${this.apiUrl}/ByParalelo/${idParalelo}`
    ).pipe(map(r => r.data || []));
  }

  /**
   * Obtener distributivos por ciclo
   */
  getByCiclo(idCiclo: number): Observable<DistributivoDTO[]> {
    return this.http.get<IResponse<DistributivoDTO[]>>(
      `${this.apiUrl}/ByCiclo/${idCiclo}`
    ).pipe(map(r => r.data || []));
  }

  /**
   * Obtener carga academica de un docente (estructura jerarquica)
   */
  getCargaDocente(idPersona: number): Observable<CargaDocenteDTO | null> {
    return this.http.get<IResponse<CargaDocenteDTO>>(
      `${this.apiUrl}/CargaDocente/${idPersona}`
    ).pipe(map(r => r.data || null));
  }

  /**
   * Obtener docentes disponibles (con rol PROFESOR)
   */
  getDocentesDisponibles(): Observable<DocenteDisponibleDTO[]> {
    return this.http.get<IResponse<DocenteDisponibleDTO[]>>(
      `${this.apiUrl}/Docentes`
    ).pipe(map(r => r.data || []));
  }

  /**
   * Crear nueva asignacion
   */
  create(data: DistributivoCreateDTO): Observable<DistributivoDTO> {
    return this.http.post<IResponse<DistributivoDTO>>(this.apiUrl, data)
      .pipe(map(r => this.validateResponse(r)));
  }

  /**
   * Crear asignaciones masivas (un docente a multiples paralelos)
   */
  createMasivo(data: DistributivoMasivoDTO): Observable<DistributivoDTO[]> {
    return this.http.post<IResponse<DistributivoDTO[]>>(
      `${this.apiUrl}/Masivo`, data
    ).pipe(map(r => this.validateResponse(r) || []));
  }

  /**
   * Actualizar asignacion
   */
  update(data: DistributivoUpdateDTO): Observable<DistributivoDTO> {
    return this.http.put<IResponse<DistributivoDTO>>(this.apiUrl, data)
      .pipe(map(r => this.validateResponse(r)));
  }

  /**
   * Eliminar asignacion
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<IResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(map(r => r.isSuccess));
  }
}
