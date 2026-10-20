import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { EstadoCivilDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class EstadoCivilService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los estados civiles
  getEstadosCiviles(): Observable<EstadoCivilDTO[]> {
    return this.http.get<IResponse<EstadoCivilDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.estadoCivil.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener estado civil por ID
  getEstadoCivilById(id: number): Observable<EstadoCivilDTO | undefined> {
    return this.getEstadosCiviles().pipe(
      map(estados => estados.find(e => e.idEstadoCivil === id))
    );
  }
}

