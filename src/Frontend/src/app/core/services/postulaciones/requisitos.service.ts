import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequisitosDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class RequisitosService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los requisitos
  getRequisitos(): Observable<RequisitosDTO[]> {
    return this.http.get<IResponse<RequisitosDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.requisitos.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener requisito por ID
  getRequisitoById(id: number): Observable<RequisitosDTO | undefined> {
    return this.getRequisitos().pipe(
      map(requisitos => requisitos.find(r => r.idRequisitos === id))
    );
  }



  // Obtener requisitos por malla
  getRequisitosByMalla(idMalla: number): Observable<RequisitosDTO[]> {
    const url = `${this.apiUrl}${API_ENDPOINTS.postulaciones.requisitos.getByMalla(idMalla)}`;
    console.log('Llamando a API de requisitos por malla:', url);
    
    return this.http.get<RequisitosDTO[]>(url).pipe(
      map(response => {
        return response;
      })
    );
  }

  // Obtener requisitos obligatorios
  getRequisitosObligatorios(): Observable<RequisitosDTO[]> {
    return this.getRequisitos().pipe(
      map(requisitos => requisitos.filter(r => r.esObligatorio))
    );
  }
}

