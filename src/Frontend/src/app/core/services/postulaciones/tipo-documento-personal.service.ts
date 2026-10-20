import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TipoDocumentoPersonalDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TipoDocumentoPersonalService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los tipos de documento personal
  getTiposDocumentoPersonal(): Observable<TipoDocumentoPersonalDTO[]> {
    return this.http.get<IResponse<TipoDocumentoPersonalDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoDocumentoPersonal.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener tipo de documento personal por ID
  getTipoDocumentoPersonalById(id: number): Observable<TipoDocumentoPersonalDTO | undefined> {
    return this.getTiposDocumentoPersonal().pipe(
      map(tipos => tipos.find(t => t.idTipoDocumentoPersonal === id))
    );
  }

  // Obtener tipos de documento personal obligatorios (primeros 5)
  getTiposDocumentoPersonalObligatorios(): Observable<TipoDocumentoPersonalDTO[]> {
    return this.getTiposDocumentoPersonal().pipe(
      map(tipos => tipos.slice(0, 5))
    );
  }

  // Obtener tipos de documento personal opcionales (resto)
  getTiposDocumentoPersonalOpcionales(): Observable<TipoDocumentoPersonalDTO[]> {
    return this.getTiposDocumentoPersonal().pipe(
      map(tipos => tipos.slice(5))
    );
  }
}