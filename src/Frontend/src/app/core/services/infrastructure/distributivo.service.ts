import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, expand, reduce, EMPTY } from 'rxjs';
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
   * Helper para extraer array de respuestas paginadas o directas
   * Soporta: array directo, { items: [] } o { data: { items: [] } }
   */
  private extractArray<T>(data: any): T[] {
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    return [];
  }

  /**
   * Helper que itera todas las páginas de forma secuencial y devuelve un array completo.
   * @param fetcher función que recibe (pageNumber, pageSize) y devuelve el raw data del backend
   * @param pageSize cantidad de registros por página (default 100)
   */
  private fetchAllPages<T>(
    fetcher: (pageNumber: number, pageSize: number) => Observable<any>,
    pageSize = 100
  ): Observable<T[]> {
    const fetch$ = (page: number): Observable<{ items: T[]; hasNextPage: boolean; page: number }> =>
      fetcher(page, pageSize).pipe(
        map((raw: any) => ({
          items: this.extractArray<T>(raw),
          hasNextPage: raw?.hasNextPage === true,
          page
        }))
      );

    return fetch$(1).pipe(
      expand(({ hasNextPage, page }) => hasNextPage ? fetch$(page + 1) : EMPTY),
      reduce((acc: T[], { items }) => [...acc, ...items], [])
    );
  }

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
    return this.fetchAllPages<any>(
      (pageNumber, pageSize) => this.http.get<IResponse<any>>(this.apiUrl, {
        params: new HttpParams().set('PageNumber', pageNumber).set('PageSize', pageSize)
      }).pipe(map(r => r.data))
    ).pipe(
      map(data => data.map((d: any) => ({
        ...d,
        idPlantillaEvaluacion: d.idPlantillaEvaluacion || 0,
        nombrePlantilla: d.nombrePlantilla || ''
      })))
    );
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
    return this.fetchAllPages<DistributivoDTO>(
      (pageNumber, pageSize) => this.http.get<IResponse<any>>(
        `${this.apiUrl}/ByDocente/${idPersona}`,
        { params: new HttpParams().set('PageNumber', pageNumber).set('PageSize', pageSize) }
      ).pipe(map(r => r.data))
    );
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
      const data = this.extractArray<any>(r.data);
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
        nombreMalla: d.nombreMalla || '',
        alumnos: d.alumnos || []
      }));
    }));
  }

  /**
   * Obtener distributivos por malla
   */
  getByMalla(idMalla: number): Observable<DistributivoDTO[]> {
    return this.fetchAllPages<DistributivoDTO>(
      (pageNumber, pageSize) => this.http.get<IResponse<any>>(
        `${this.apiUrl}/ByMalla/${idMalla}`,
        { params: new HttpParams().set('PageNumber', pageNumber).set('PageSize', pageSize) }
      ).pipe(map(r => r.data))
    );
  }

  /**
   * Obtener distributivos por paralelo
   */
  getByParalelo(idParalelo: number): Observable<DistributivoDTO[]> {
    return this.fetchAllPages<DistributivoDTO>(
      (pageNumber, pageSize) => this.http.get<IResponse<any>>(
        `${this.apiUrl}/ByParalelo/${idParalelo}`,
        { params: new HttpParams().set('PageNumber', pageNumber).set('PageSize', pageSize) }
      ).pipe(map(r => r.data))
    );
  }

  /**
   * Obtener distributivos por ciclo
   */
  getByCiclo(idCiclo: number): Observable<DistributivoDTO[]> {
    return this.fetchAllPages<DistributivoDTO>(
      (pageNumber, pageSize) => this.http.get<IResponse<any>>(
        `${this.apiUrl}/ByCiclo/${idCiclo}`,
        { params: new HttpParams().set('PageNumber', pageNumber).set('PageSize', pageSize) }
      ).pipe(map(r => r.data))
    );
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
    return this.http.get<IResponse<any>>(
      `${this.apiUrl}/Docentes`
    ).pipe(map(r => this.extractArray<DocenteDisponibleDTO>(r.data)));
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
