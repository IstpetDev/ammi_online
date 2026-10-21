import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TipoDiscapacidadDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TipoDiscapacidadService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los tipos de discapacidad
  getTiposDiscapacidad(): Observable<TipoDiscapacidadDTO[]> {
    return this.http.get<IResponse<TipoDiscapacidadDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoDiscapacidad.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener tipo de discapacidad por ID
  getTipoDiscapacidadById(id: number): Observable<TipoDiscapacidadDTO | undefined> {
    return this.getTiposDiscapacidad().pipe(
      map(tipos => tipos.find(t => t.idTipoDiscapacidad === id))
    );
  }

  // Obtener tipos de discapacidad que requieren recomendaciones específicas
  getTiposDiscapacidadConRecomendaciones(): Observable<TipoDiscapacidadDTO[]> {
    return this.getTiposDiscapacidad().pipe(
      map(tipos => tipos.filter(t =>
        t.recomendaciones && t.recomendaciones.trim() !== '' && t.nombre !== 'Ninguna'
      ))
    );
  }

  create(data: Partial<TipoDiscapacidadDTO>): Observable<any> {
    return this.http.post<IResponse<any>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoDiscapacidad.create}`, { tipoDiscapacidadDTO: data }).pipe(
      map(response => response.data)
    );
  }
}