import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PersonaNacionalidadDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

export interface PersonaNacionalidadRequest {
  idPersona: number;
  idPais: number;
  nacio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PersonaNacionalidadService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getByPersona(idPersona: number): Observable<PersonaNacionalidadDTO[]> {
    return this.http.get<IResponse<PersonaNacionalidadDTO[]>>(
      `${this.apiUrl}${API_ENDPOINTS.personaNacionalidad.getByPersona(idPersona)}`
    ).pipe(
      map(response => response.data || [])
    );
  }

  create(data: PersonaNacionalidadRequest): Observable<any> {
    return this.http.post<IResponse<any>>(
      `${this.apiUrl}${API_ENDPOINTS.personaNacionalidad.create}`, data
    ).pipe(
      map(response => response.data)
    );
  }

  update(data: PersonaNacionalidadRequest): Observable<any> {
    return this.http.put<IResponse<any>>(
      `${this.apiUrl}${API_ENDPOINTS.personaNacionalidad.update}`, data
    ).pipe(
      map(response => response.data)
    );
  }
}
