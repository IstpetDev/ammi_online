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

  /**
   * Obtener todas las mallas
   */
  getMallas(): Observable<MallaDTO[]> {
    return this.http.get<MallaDTO[]>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.malla.getAll}`);
  }

  /**
   * Obtener mallas por tipo de oferta
   */
  getMallasByTipoOferta(idTipoOferta: number): Observable<MallaDTO[]> {
    const url = `${this.apiUrl}${API_ENDPOINTS.postulaciones.malla.getByTipoOferta(idTipoOferta)}`;
    return this.http.get<MallaDTO[]>(url);
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
}
