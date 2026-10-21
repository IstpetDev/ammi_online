import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TipoOfertaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TipoOfertaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los tipos de oferta
  getTiposOferta(): Observable<TipoOfertaDTO[]> {
    return this.http.get<IResponse<TipoOfertaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoOferta.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener tipo de oferta por ID
  getTipoOfertaById(id: number): Observable<TipoOfertaDTO | undefined> {
    return this.getTiposOferta().pipe(
      map(tipos => tipos.find(t => t.idtipoOferta === id))
    );
  }

  // Obtener tipos de oferta activos
  getTiposOfertaActivos(): Observable<TipoOfertaDTO[]> {
    return this.getTiposOferta().pipe(
      map(tipos => tipos.filter(t => t.esActivo))
    );
  }

  create(data: Partial<TipoOfertaDTO>): Observable<TipoOfertaDTO> {
    return this.http.post<IResponse<TipoOfertaDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoOferta.create}`, data).pipe(
      map(response => response.data)
    );
  }
}

