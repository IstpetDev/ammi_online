import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';
import { TipoPlantillaEstructuraDTO } from '../../../data/models/notas';

@Injectable({
  providedIn: 'root'
})
export class TipoPlantillaEstructuraService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los tipos de estructura
   */
  getAll(): Observable<TipoPlantillaEstructuraDTO[]> {
    return this.http.get<TipoPlantillaEstructuraDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.tipoPlantillaEstructura.getAll}`
    );
  }

  /**
   * Obtener solo tipos activos
   * Nota: El backend no tiene endpoint separado, usa getAll
   */
  getActivos(): Observable<TipoPlantillaEstructuraDTO[]> {
    return this.getAll();
  }

  /**
   * Crear nuevo tipo de estructura
   */
  create(data: { detalle: string }): Observable<TipoPlantillaEstructuraDTO> {
    return this.http.post<TipoPlantillaEstructuraDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.tipoPlantillaEstructura.create}`,
      data
    );
  }

  /**
   * Actualizar tipo de estructura
   */
  update(data: TipoPlantillaEstructuraDTO): Observable<TipoPlantillaEstructuraDTO> {
    return this.http.put<TipoPlantillaEstructuraDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.tipoPlantillaEstructura.update}`,
      data
    );
  }

  /**
   * Eliminar tipo de estructura
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(
      `${this.apiUrl}${API_ENDPOINTS.notas.tipoPlantillaEstructura.delete(id)}`
    );
  }
}
