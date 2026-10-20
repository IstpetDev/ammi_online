import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RegimenDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class RegimenService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los regímenes
  getRegimenes(): Observable<RegimenDTO[]> {
    return this.http.get<IResponse<RegimenDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.regimen.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener régimen por ID
  getRegimenById(id: number): Observable<RegimenDTO | undefined> {
    return this.getRegimenes().pipe(
      map(regimenes => regimenes.find(r => r.idRegimen === id))
    );
  }
}

