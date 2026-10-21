import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TipoDocumentoDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TipoDocumentoService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los tipos de documento
  getTiposDocumento(): Observable<TipoDocumentoDTO[]> {
    return this.http.get<IResponse<TipoDocumentoDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoDocumento.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener tipo de documento por ID
  getTipoDocumentoById(id: number): Observable<TipoDocumentoDTO | undefined> {
    return this.getTiposDocumento().pipe(
      map(tipos => tipos.find(t => t.idTipoDocumento === id))
    );
  }

  create(data: Partial<TipoDocumentoDTO>): Observable<TipoDocumentoDTO> {
    return this.http.post<IResponse<TipoDocumentoDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoDocumento.create}`, data).pipe(
      map(response => response.data)
    );
  }
}

