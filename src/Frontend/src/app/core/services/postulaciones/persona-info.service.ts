import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PersonaInfoDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

export interface PersonaInfoRequest {
  idPersona: number;
  fechaNacimiento?: string;
  idEstadoCivil?: number;
  idNacionalidadEtnica?: number;
  idTipoSangre?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PersonaInfoService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getByPersona(idPersona: number): Observable<PersonaInfoDTO | null> {
    return this.http.get<IResponse<PersonaInfoDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.personaInfo.getByPersona(idPersona)}`).pipe(
      map(response => {
        const data = response.data;
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
      })
    );
  }

  create(data: PersonaInfoRequest): Observable<any> {
    return this.http.post<IResponse<any>>(`${this.apiUrl}${API_ENDPOINTS.personaInfo.create}`, data).pipe(
      map(response => response.data)
    );
  }

  update(data: PersonaInfoRequest): Observable<any> {
    return this.http.put<IResponse<any>>(`${this.apiUrl}${API_ENDPOINTS.personaInfo.update}`, data).pipe(
      map(response => response.data)
    );
  }
}
