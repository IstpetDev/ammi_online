import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PersonaActividadEconomicaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

export interface PersonaActividadEconomicaRequest {
  idPersonaActividadEconomica?: number;
  idPersona?: number;
  idTipoActividadEconomica: number;
  valor: number;
  esPrincipal: boolean;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PersonaActividadEconomicaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getByPersona(idPersona: number): Observable<PersonaActividadEconomicaDTO[]> {
    return this.http.get<IResponse<PersonaActividadEconomicaDTO[]>>(
      `${this.apiUrl}${API_ENDPOINTS.personaActividadEconomica.getByPersona(idPersona)}`
    ).pipe(
      map(response => response.data || [])
    );
  }

  create(data: PersonaActividadEconomicaRequest): Observable<any> {
    return this.http.post<IResponse<any>>(
      `${this.apiUrl}${API_ENDPOINTS.personaActividadEconomica.create}`, data
    ).pipe(
      map(response => response.data)
    );
  }

  update(data: PersonaActividadEconomicaRequest): Observable<any> {
    return this.http.put<IResponse<any>>(
      `${this.apiUrl}${API_ENDPOINTS.personaActividadEconomica.update}`, data
    ).pipe(
      map(response => response.data)
    );
  }
}
