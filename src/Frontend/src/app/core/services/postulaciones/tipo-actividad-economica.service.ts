import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TipoActividadEconomicaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TipoActividadEconomicaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los tipos de actividad económica
  getTiposActividadEconomica(): Observable<TipoActividadEconomicaDTO[]> {
    return this.http.get<IResponse<TipoActividadEconomicaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoActividadEconomica.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener tipo de actividad económica por ID
  getTipoActividadEconomicaById(id: number): Observable<TipoActividadEconomicaDTO | undefined> {
    return this.getTiposActividadEconomica().pipe(
      map(tipos => tipos.find(t => t.idtipoActividadEconomica === id))
    );
  }

  // Obtener tipos de actividad económica formales
  getTiposActividadEconomicaFormales(): Observable<TipoActividadEconomicaDTO[]> {
    return this.getTiposActividadEconomica().pipe(
      map(tipos => tipos.filter(t => t.esFormal))
    );
  }

  // Obtener tipos de actividad económica informales
  getTiposActividadEconomicaInformales(): Observable<TipoActividadEconomicaDTO[]> {
    return this.getTiposActividadEconomica().pipe(
      map(tipos => tipos.filter(t => !t.esFormal))
    );
  }

  create(data: Partial<TipoActividadEconomicaDTO>): Observable<TipoActividadEconomicaDTO> {
    return this.http.post<IResponse<TipoActividadEconomicaDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoActividadEconomica.create}`, data).pipe(
      map(response => response.data)
    );
  }
}