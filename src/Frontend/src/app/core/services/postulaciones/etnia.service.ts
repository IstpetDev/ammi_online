import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { EtniaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class EtniaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las etnias
  getEtnias(): Observable<EtniaDTO[]> {
    return this.http.get<IResponse<EtniaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.etnia.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener etnia por ID
  getEtniaById(id: number): Observable<EtniaDTO | undefined> {
    return this.getEtnias().pipe(
      map(etnias => etnias.find(e => e.idEtnia === id))
    );
  }

  create(data: Partial<EtniaDTO>): Observable<EtniaDTO> {
    return this.http.post<IResponse<EtniaDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.etnia.create}`, data).pipe(
      map(response => response.data)
    );
  }
}

