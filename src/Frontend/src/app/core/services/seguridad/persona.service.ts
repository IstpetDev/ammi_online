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

  // Obtener todas las personas
  getPersonas(): Observable<PersonaDTO[]> {
    return this.http.get<IResponse<PersonaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.persona.getByDocumento}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener persona por ID
  getPersonaById(id: number): Observable<PersonaDTO | undefined> {
    return this.getPersonas().pipe(
      map(personas => personas.find(p => p.idPersona === id))
    );
  }

  // Crear persona
  createPersona(persona: PersonaDTO): Observable<PersonaDTO> {
    return this.http.post<IResponse<PersonaDTO>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.persona.create}`, persona).pipe(
      map(response => response.data)
    );
  }

  // Actualizar persona
  updatePersona(persona: PersonaDTO): Observable<PersonaDTO> {
    return this.http.put<IResponse<PersonaDTO>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.persona.update}`, persona).pipe(
      map(response => response.data)
    );
  }

  // Eliminar persona
  deletePersona(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ENDPOINTS.seguridad.persona.delete}`);
  }
}