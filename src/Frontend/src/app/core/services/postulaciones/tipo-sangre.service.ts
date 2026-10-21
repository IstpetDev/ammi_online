import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TipoSangreDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TipoSangreService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los tipos de sangre
  getTiposSangre(): Observable<TipoSangreDTO[]> {
    return this.http.get<IResponse<TipoSangreDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.tipoSangre.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener tipo de sangre por ID
  getTipoSangreById(id: number): Observable<TipoSangreDTO | undefined> {
    return this.getTiposSangre().pipe(
      map(tipos => tipos.find(t => t.idTipoSangre === id))
    );
  }
}