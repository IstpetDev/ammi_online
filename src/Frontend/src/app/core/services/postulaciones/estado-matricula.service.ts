import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';
import { EstadoMatriculaDTO } from '../../../data/models/rematricula.model';

@Injectable({
  providedIn: 'root'
})
export class EstadoMatriculaService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<EstadoMatriculaDTO[]> {
    return this.http.get<any>(`${API_BASE_URL}${API_ENDPOINTS.postulaciones.estadoMatricula.getAll}`).pipe(
      map((response: any) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.items)) return response.items;
        return [];
      })
    );
  }

  getCompletados(): Observable<EstadoMatriculaDTO[]> {
    return this.getAll().pipe(
      map((items) => items.filter((i) => i.completado))
    );
  }
}
