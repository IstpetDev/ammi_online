import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PersonaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los períodos lectivos
  getPersonaByDocumento(documento: string): Observable<PersonaDTO[]> {
    return this.http.get<IResponse<PersonaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.persona.getByDocumento(documento)}`).pipe(
      map(response => response.data)
    );
  }

  
}

