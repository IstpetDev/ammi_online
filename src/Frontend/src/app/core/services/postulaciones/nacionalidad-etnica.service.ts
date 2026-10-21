import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { NacionalidadEtnicaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class NacionalidadEtnicaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener nacionalidades étnicas por etnia
  getNacionalidadesEtnicasByEtnia(etniaId: number): Observable<NacionalidadEtnicaDTO[]> {
    return this.http.get<IResponse<NacionalidadEtnicaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.nacionalidadEtnica.getByEtnia(etniaId)}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener todas las nacionalidades étnicas
  getNacionalidadesEtnicas(): Observable<NacionalidadEtnicaDTO[]> {
    return this.http.get<IResponse<NacionalidadEtnicaDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.nacionalidadEtnica.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener nacionalidad étnica por ID
  getNacionalidadEtnicaById(id: number): Observable<NacionalidadEtnicaDTO | undefined> {
    return this.getNacionalidadesEtnicas().pipe(
      map(list => list.find(n => n.idnacionalidadEtnica === id))
    );
  }

  create(data: Partial<NacionalidadEtnicaDTO>): Observable<any> {
    return this.http.post<IResponse<any>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.nacionalidadEtnica.create}`, { nacionalidadEtnicaDTO: data }).pipe(
      map(response => response.data)
    );
  }
}

