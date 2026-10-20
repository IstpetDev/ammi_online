import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ParroquiaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class ParroquiaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las parroquias
  getParroquias(): Observable<ParroquiaDTO[]> {
    return this.http.get<IResponse<ParroquiaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.parroquia.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener parroquia por ID
  getParroquiaById(id: number): Observable<ParroquiaDTO | undefined> {
    return this.getParroquias().pipe(
      map(parroquias => parroquias.find(p => p.idParroquia === id))
    );
  }

  // Obtener parroquias por cantón
  getParroquiasByCanton(idCanton: number): Observable<ParroquiaDTO[]> {
    return this.http.get<IResponse<ParroquiaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.parroquia.getByCanton(idCanton)}`).pipe(
      map(response => response.data)
    );
  }
}

