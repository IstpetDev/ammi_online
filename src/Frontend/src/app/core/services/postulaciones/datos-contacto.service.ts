import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

export interface DatosContactoDTO {
  idDatosContacto?: number;
  idPersona?: number;
  idTipoDatoContacto?: number;
  detalle?: string;
  esPrincipal?: boolean;
  tipocontacto?: {
    idTipoDatoContacto: number;
    detalle: string;
  };
}

export interface DatosContactoRequest {
  idDatosContacto?: number;
  idPersona: number;
  idTipoDatoContacto: number;
  detalle: string;
  esPrincipal?: boolean;
}

export interface CreateDatosContactoRequest {
  datosContactos: DatosContactoRequest[];
}

@Injectable({
  providedIn: 'root'
})
export class DatosContactoService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getByPersona(idPersona: number): Observable<DatosContactoDTO[]> {
    return this.http.get<IResponse<DatosContactoDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.datosContactos.getByPersona(idPersona)}`).pipe(
      map(response => response.data || [])
    );
  }

  create(data: CreateDatosContactoRequest): Observable<any> {
    return this.http.post<IResponse<any>>(`${this.apiUrl}${API_ENDPOINTS.datosContactos.create}`, data).pipe(
      map(response => response.data)
    );
  }

  update(data: DatosContactoRequest): Observable<any> {
    return this.http.put<IResponse<any>>(`${this.apiUrl}${API_ENDPOINTS.datosContactos.update}`, data).pipe(
      map(response => response.data)
    );
  }
}
