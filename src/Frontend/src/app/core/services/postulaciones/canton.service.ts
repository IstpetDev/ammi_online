import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CantonDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class CantonService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los cantones
  getCantones(): Observable<CantonDTO[]> {
    return this.http.get<IResponse<CantonDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.canton.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener cantón por ID
  getCantonById(id: number): Observable<CantonDTO | undefined> {
    return this.getCantones().pipe(
      map(cantones => cantones.find(c => c.idCanton === id))
    );
  }

  // Obtener cantones por provincia
  getCantonesByProvincia(idProvincia: number): Observable<CantonDTO[]> {
    return this.http.get<IResponse<CantonDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.canton.getByProvincia(idProvincia)}`).pipe(
      map(response => response.data)
    );
  }

  create(data: Partial<CantonDTO>): Observable<any> {
    return this.http.post<IResponse<any>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.canton.create}`, { cantonDTO: data }).pipe(
      map(response => response.data)
    );
  }
}

