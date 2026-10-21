import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IResponse } from '../../../data/models/IResponse';
import {
  DetalleMallaDTO,
  DetalleMallaCreateDTO,
  DetalleMallaUpdateDTO,
  FechasSugeridasModuloDTO
} from '../../../data/models/detalle-malla/detalle-malla.model';

@Injectable({
  providedIn: 'root'
})
export class DetalleMallaService {


  private apiUrl = `${environment.apiUrl}/DetalleMalla`;

  constructor(private http: HttpClient) {}

  private unwrapData<T>(response: any): T | null {
    if (response == null) return null;
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as IResponse<T>).data ?? null;
    }
    return response as T;
  }

  /**
   * Obtener DetalleMalla por ID
   */
  getById(id: number): Observable<DetalleMallaDTO | null> {
    console.log('🌐 DetalleMallaService.getById llamado con ID:', id);
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(map(r => {
        
        // Si la respuesta tiene una propiedad 'data', es un IResponse
        if (r && r.data) {
          return r.data;
        }
        // Si la respuesta tiene idDetalleMalla directamente, es el objeto DetalleMallaDTO
        else if (r && r.idDetalleMalla) {
          return r as DetalleMallaDTO;
        }
        
        return null;
      }));
  }

  /**
   * Obtener todas las materias de una malla
   * IMPORTANTE: Este es el endpoint principal para el modal de asignacion
   */
  getByMalla(idMalla: number, pageNumber: number, pageSize: number): Observable<DetalleMallaDTO[]> {
    const url = `${this.apiUrl}/ByMalla/${idMalla}?pageNumber=${pageNumber}&pageSize=${pageSize}`;

    return this.http.get<any>(url).pipe(
      map(response => {

        // Handle direct array response (legacy)
        if (Array.isArray(response)) {
          return response as DetalleMallaDTO[];
        }

        // Handle paginated response with items property
        if (response && Array.isArray(response.items)) {
          return response.items as DetalleMallaDTO[];
        }

        // Handle IResponse wrapper with data.items
        if (response && response.data && Array.isArray(response.data.items)) {
          return response.data.items as DetalleMallaDTO[];
        }

        // Handle IResponse wrapper with data as array
        if (response && Array.isArray(response.data)) {
          return response.data as DetalleMallaDTO[];
        }

        return [];
      })
    );
  }

  /**
   * Crear nuevo DetalleMalla
   */
  create(data: DetalleMallaCreateDTO): Observable<DetalleMallaDTO> {
    return this.http.post<any>(this.apiUrl, data)
      .pipe(map(r => this.unwrapData<DetalleMallaDTO>(r) as DetalleMallaDTO));
  }

  /**
   * Crear multiples DetalleMalla (bulk)
   */
  createBulk(data: DetalleMallaCreateDTO[]): Observable<DetalleMallaDTO[]> {
    return this.http.post<any>(
      `${this.apiUrl}/Bulk`, data
    ).pipe(
      map(r => {
        const unwrapped = this.unwrapData<DetalleMallaDTO[] | DetalleMallaDTO>(r);
        if (Array.isArray(unwrapped)) return unwrapped;
        if (unwrapped) return [unwrapped as DetalleMallaDTO];
        return [];
      })
    );
  }

  /**
   * Actualizar DetalleMalla
   */
  update(data: DetalleMallaUpdateDTO): Observable<DetalleMallaDTO> {
    return this.http.put<any>(this.apiUrl, data)
      .pipe(map(r => this.unwrapData<DetalleMallaDTO>(r) as DetalleMallaDTO));
  }

  /**
   * Eliminar DetalleMalla
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<IResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(map(r => r.isSuccess));
  }

  /**
   * Obtener fechas sugeridas de un modulo para el mismo periodo y ciclo
   */
  getFechasSugeridasModulo(idCiclo: number, modulo: number): Observable<FechasSugeridasModuloDTO | null> {
    const url = `${this.apiUrl}/FechasSugeridas?idCiclo=${idCiclo}&modulo=${modulo}`;
    return this.http.get<any>(url).pipe(
      map(r => this.unwrapData<FechasSugeridasModuloDTO>(r))
    );
  }

  /**
   * Actualizar fechas de ingreso de notas para una materia
   */
  actualizarFechasNotas(idDetalleMalla: number, dto: { idDetalleMalla: number; fechaInicio?: string | null; fechaFin?: string | null; diasGracia?: number }): Observable<DetalleMallaDTO> {
    return this.http.put<any>(`${this.apiUrl}/${idDetalleMalla}/FechasNotas`, dto)
      .pipe(map(r => this.unwrapData<DetalleMallaDTO>(r) as DetalleMallaDTO));
  }
}

