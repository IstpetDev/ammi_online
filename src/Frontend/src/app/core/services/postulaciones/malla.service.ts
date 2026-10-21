import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MallaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class MallaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private normalizarMallasResponse(response: any): MallaDTO[] {
    if (Array.isArray(response)) {
      return response as MallaDTO[];
    }

    if (response?.data?.items && Array.isArray(response.data.items)) {
      return response.data.items as MallaDTO[];
    }

    if (Array.isArray(response?.items)) {
      return response.items as MallaDTO[];
    }

    if (Array.isArray(response?.data)) {
      return response.data as MallaDTO[];
    }

    return [];
  }

  /**
   * Obtener todas las mallas
   */
  getMallas(): Observable<MallaDTO[]> {
    return this.http.get<any>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.malla.getAll}`).pipe(
      map(response => this.normalizarMallasResponse(response))
    );
  }

  /**
   * Obtener mallas por tipo de oferta
   */
  getMallasByTipoOferta(idTipoOferta: number): Observable<MallaDTO[]> {
    const url = `${this.apiUrl}${API_ENDPOINTS.postulaciones.malla.getByTipoOferta(idTipoOferta)}`;
    return this.http.get<any>(url).pipe(
      map(response => this.normalizarMallasResponse(response))
    );
  }

  /**
   * Obtener malla por id
   */
  getMallaById(idMalla: number): Observable<MallaDTO | undefined> {
    return this.getMallas().pipe(
      map(mallas => mallas.find(m => m.idMalla === idMalla))
    );
  }

  /**
   * Obtener cursos asociados a una malla
   */
  getCursosByMalla(idMalla: number): Observable<number | undefined> {
    return this.getMallaById(idMalla).pipe(
      map(malla => malla?.idCursos)
    );
  }

  /**
   * Obtener mallas con parámetros de filtrado (IdTipoOferta, IdCiclo, etc.)
   */
  getMallasByParams(params?: { IdTipoOferta?: number, IdCiclo?: number, IdMalla?: number, IdCursos?: number, Detalle?: string }): Observable<MallaDTO[]> {
    const url = `${this.apiUrl}${API_ENDPOINTS.postulaciones.malla.getByParams(params)}`;
    return this.http.get<IResponse<MallaDTO[]> | any>(url).pipe(
      map(response => this.normalizarMallasResponse(response))
    );
  }
}
