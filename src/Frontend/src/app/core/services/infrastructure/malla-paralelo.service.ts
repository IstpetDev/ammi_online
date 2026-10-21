import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MallaParaleloDTO, MallaParaleloCreateDTO, ActivarMallaParaleloDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { API_ENDPOINTS } from '../../constants/app.constants';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MallaParaleloService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getByMalla(idMalla: number): Observable<MallaParaleloDTO[]> {
    return this.http.get<any>(
      `${this.apiUrl}${API_ENDPOINTS.infraestructura.mallaParalelo.getByMalla(idMalla)}`
    ).pipe(map(r => {
      const unwrapped = this.unwrapData<MallaParaleloDTO[]>(r);
      return Array.isArray(unwrapped) ? unwrapped : [];
    }));
  }

  private unwrapData<T>(response: any): T | null {
    if (response == null) return null;
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as IResponse<T>).data ?? null;
    }
    return response as T;
  }

  create(dto: MallaParaleloCreateDTO): Observable<number> {
    return this.http.post<any>(
      `${this.apiUrl}${API_ENDPOINTS.infraestructura.mallaParalelo.create}`,
      dto
    ).pipe(map(r => this.unwrapData<number>(r) ?? 0));
  }

  activar(id: number, dto: ActivarMallaParaleloDTO): Observable<boolean> {
    return this.http.put<any>(
      `${this.apiUrl}${API_ENDPOINTS.infraestructura.mallaParalelo.activar(id)}`,
      dto
    ).pipe(map(r => this.unwrapData<boolean>(r) ?? false));
  }

  desactivar(id: number): Observable<boolean> {
    return this.http.put<any>(
      `${this.apiUrl}${API_ENDPOINTS.infraestructura.mallaParalelo.desactivar(id)}`,
      {}
    ).pipe(map(r => this.unwrapData<boolean>(r) ?? false));
  }
}
