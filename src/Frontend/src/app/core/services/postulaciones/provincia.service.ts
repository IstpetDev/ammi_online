import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ProvinciaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class ProvinciaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las provincias
  getProvincias(): Observable<ProvinciaDTO[]> {
    // Para obtener todas, podríamos llamar a getProvinciasByPais con un ID general, pero por ahora mantenemos mock o asumimos
    // Como no hay endpoint para todas, mantenemos mock por ahora
    return this.getProvinciasByPais(1); // Ecuador por defecto
  }

  // Obtener provincia por ID
  getProvinciaById(id: number): Observable<ProvinciaDTO | undefined> {
    return this.getProvincias().pipe(
      map(provincias => provincias.find(p => p.idProvincia === id))
    );
  }

  // Obtener provincias por país
  getProvinciasByPais(idPais: number): Observable<ProvinciaDTO[]> {
    return this.http.get<IResponse<ProvinciaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.provincia.getByPais(idPais)}`).pipe(
      map(response => response.data)
    );
  }
}

