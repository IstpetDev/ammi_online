import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ModuloDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class ModuloService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los módulos
  getModulos(): Observable<ModuloDTO[]> {
    return this.http.get<IResponse<ModuloDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.seguridad.modulo.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener módulo por ID
  getModuloById(id: number): Observable<ModuloDTO | undefined> {
    return this.getModulos().pipe(
      map(modulos => modulos.find(m => m.idModulo === id))
    );
  }
}