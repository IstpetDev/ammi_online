import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IResponse } from '../../../data/models/IResponse';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';
import { EstudianteBeneficioDTO } from '../../../data/models/Entities';

@Injectable({
  providedIn: 'root'
})
export class EstudianteBeneficioService {

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de beneficios asignados a un alumno.
   * GET /api/EstudianteBeneficio/ByAlumno/{idPersona}
   */
  getByAlumno(idPersona: number): Observable<EstudianteBeneficioDTO[]> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.estudianteBeneficio.getByAlumno(idPersona)}`;
    return this.http.get<IResponse<EstudianteBeneficioDTO[]>>(url).pipe(
      map(response => response.data ?? [])
    );
  }

  asignarBeneficio(idPersona: number, idBeneficio: number): Observable<EstudianteBeneficioDTO> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.estudianteBeneficio.create}`;
    return this.http.post<IResponse<EstudianteBeneficioDTO>>(url, { idPersona, idBeneficio }).pipe(
      map(response => response.data)
    );
  }

  asignarBeneficioCompleto(payload: {
    idPersona: number;
    idBeneficio: number;
    idCiclo: number;
    fechaInicio: string;
    fechaFin: string | null;
    idAprobadoPor: number;
    observaciones: string;
  }): Observable<EstudianteBeneficioDTO> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.estudianteBeneficio.create}`;
    return this.http.post<IResponse<EstudianteBeneficioDTO>>(url, payload).pipe(
      map(response => response.data!)
    );
  }
    desactivar(payload: { idEstudianteBeneficio: number; observaciones: string }): Observable<void> {
      const url = `${API_BASE_URL}${API_ENDPOINTS.pagos.estudianteBeneficio.desactivar}`;
      return this.http.put<IResponse<void>>(url, payload).pipe(
        map(() => void 0)
      );
    }
}
