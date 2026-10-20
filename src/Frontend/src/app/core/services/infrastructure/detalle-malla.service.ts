import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IResponse } from '../../../data/models/IResponse';
import {
  DetalleMallaDTO,
  DetalleMallaCreateDTO,
  DetalleMallaUpdateDTO,
  DetalleMallaBulkDTO
} from '../../../data/models/detalle-malla/detalle-malla.model';

@Injectable({
  providedIn: 'root'
})
export class DetalleMallaService {
  private apiUrl = `${environment.apiUrl}/DetalleMalla`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener DetalleMalla por ID
   */
  getById(id: number): Observable<DetalleMallaDTO | null> {
    console.log('🌐 DetalleMallaService.getById llamado con ID:', id);
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(map(r => {
        console.log('🌐 Respuesta RAW del backend:', r);
        console.log('🌐 Tipo de respuesta:', typeof r);
        console.log('🌐 ¿Tiene propiedad data?', 'data' in r);
        console.log('🌐 ¿Tiene propiedad idDetalleMalla?', 'idDetalleMalla' in r);
        
        // Si la respuesta tiene una propiedad 'data', es un IResponse
        if (r && r.data) {
          console.log('🌐 Respuesta tipo IResponse, retornando r.data:', r.data);
          return r.data;
        }
        // Si la respuesta tiene idDetalleMalla directamente, es el objeto DetalleMallaDTO
        else if (r && r.idDetalleMalla) {
          console.log('🌐 Respuesta directa DetalleMallaDTO:', r);
          return r as DetalleMallaDTO;
        }
        
        console.log('🌐 Respuesta no reconocida, retornando null');
        return null;
      }));
  }

  /**
   * Obtener todas las materias de una malla
   * IMPORTANTE: Este es el endpoint principal para el modal de asignacion
   * NOTA: Este endpoint retorna directamente un array, NO usa IResponse wrapper
   */
  getByMalla(idMalla: number): Observable<DetalleMallaDTO[]> {
    const url = `${this.apiUrl}/ByMalla/${idMalla}`;
    return this.http.get<DetalleMallaDTO[]>(url).pipe(
      map(response => response || [])
    );
  }

  /**
   * Crear nuevo DetalleMalla
   */
  create(data: DetalleMallaCreateDTO): Observable<DetalleMallaDTO> {
    return this.http.post<IResponse<DetalleMallaDTO>>(this.apiUrl, data)
      .pipe(map(r => r.data!));
  }

  /**
   * Crear multiples DetalleMalla (bulk)
   */
  createBulk(data: DetalleMallaBulkDTO): Observable<DetalleMallaDTO[]> {
    return this.http.post<IResponse<DetalleMallaDTO[]>>(
      `${this.apiUrl}/Bulk`, data
    ).pipe(map(r => r.data || []));
  }

  /**
   * Actualizar DetalleMalla
   */
  update(data: DetalleMallaUpdateDTO): Observable<DetalleMallaDTO> {
    return this.http.put<IResponse<DetalleMallaDTO>>(this.apiUrl, data)
      .pipe(map(r => r.data!));
  }

  /**
   * Eliminar DetalleMalla
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<IResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(map(r => r.isSuccess));
  }
}
