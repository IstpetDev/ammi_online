import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TipoEstadoAprobacionDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TipoEstadoAprobacionService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los estados de postulación
  getEstadosPostulacion(): Observable<TipoEstadoAprobacionDTO[]> {
    return this.http.get<IResponse<TipoEstadoAprobacionDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoEstadoAprobacion.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener estado de postulación por ID
  getEstadoPostulacionById(id: number): Observable<TipoEstadoAprobacionDTO | undefined> {
    return this.getEstadosPostulacion().pipe(
      map(estados => estados.find(e => e.idTipoEstadoAprobacion === id))
    );
  }
}

