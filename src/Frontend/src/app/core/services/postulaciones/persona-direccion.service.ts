import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PersonaDireccionDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

export interface PersonaDireccionCreateRequest {
  idPersona: number;
  idParroquia: number;
  direccionDomiciliaria: string;
  activo: boolean;
}

export interface PersonaDireccionUpdateRequest {
  idPersonaDireccion?: number;
  idPersona?: number;
  idParroquia: number;
  direccionDomiciliaria: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PersonaDireccionService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getByPersona(idPersona: number): Observable<PersonaDireccionDTO | null> {
    return this.http.get<IResponse<PersonaDireccionDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.personaDireccion.getByPersona(idPersona)}`).pipe(
      map(response => {
        const data = response.data;
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
      })
    );
  }

  create(data: PersonaDireccionCreateRequest): Observable<any> {
    return this.http.post<IResponse<any>>(`${this.apiUrl}${API_ENDPOINTS.personaDireccion.create}`, data).pipe(
      map(response => response.data)
    );
  }

  update(data: PersonaDireccionUpdateRequest): Observable<any> {
    return this.http.put<IResponse<any>>(`${this.apiUrl}${API_ENDPOINTS.personaDireccion.update}`, data).pipe(
      map(response => response.data)
    );
  }
}
