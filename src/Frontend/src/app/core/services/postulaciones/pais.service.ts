import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PaisDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class PaisService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los países
  getPaises(): Observable<PaisDTO[]> {
    return this.http.get<IResponse<PaisDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.pais.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener país por ID
  getPaisById(id: number): Observable<PaisDTO | undefined> {
    return this.getPaises().pipe(
      map(paises => paises.find(p => p.idPais === id))
    );
  }
}


