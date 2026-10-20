import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { GeneroDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class GeneroService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los géneros
  getGeneros(): Observable<GeneroDTO[]> {
    return this.http.get<IResponse<GeneroDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.genero.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener género por ID
  getGeneroById(id: number): Observable<GeneroDTO | undefined> {
    return this.getGeneros().pipe(
      map(generos => generos.find(g => g.idGenero === id))
    );
  }
}

