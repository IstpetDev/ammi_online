import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PeriodoLectivoDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class PeriodoLectivoService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los períodos lectivos
  getPeriodosLectivos(): Observable<PeriodoLectivoDTO[]> {
    return this.http.get<IResponse<PeriodoLectivoDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.periodosLectivos.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener período lectivo por ID
  getPeriodoLectivoById(id: number): Observable<PeriodoLectivoDTO | undefined> {
    return this.getPeriodosLectivos().pipe(
      map(periodos => periodos.find(p => p.idPeriodoLectivo === id))
    );
  }
}

