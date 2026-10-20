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
  getAll(): Observable<TipoOfertaDTO[]> {
    return this.http.get<IResponse<TipoOfertaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.tipoOferta.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener tipo de oferta por ID
  getById(id: number): Observable<TipoOfertaDTO | undefined> {
    return this.getAll().pipe(
      map(tipos => tipos.find(t => t.idtipoOferta === id))
    );
  }

  // Crear un nuevo tipo de oferta
  create(tipo: TipoOfertaDTO): Observable<TipoOfertaDTO> {
    return this.http.post<IResponse<TipoOfertaDTO>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.tipoOferta.create}`, tipo).pipe(
      map(response => response.data)
    );
  }

  // Actualizar un tipo de oferta
  update(tipo: TipoOfertaDTO): Observable<TipoOfertaDTO> {
    return this.http.put<IResponse<TipoOfertaDTO>>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.tipoOferta.update}`, tipo).pipe(
      map(response => response.data)
    );
  }

  // Eliminar un tipo de oferta por ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.infraestructura.tipoOferta.delete(id)}`);
  }
}