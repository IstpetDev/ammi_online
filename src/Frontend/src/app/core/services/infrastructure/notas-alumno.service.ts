import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';
import { IResponse } from '../../../data/models/IResponse';
import {
  NotasAlumnoDTO,
  NotasAlumnoCreateDTO,
  NotasAlumnoUpdateDTO,
  NotasMasivasDTO
} from '../../../data/models/notas';
import { BoletinAlumnoDTO } from '../../../data/models/notas';

@Injectable({
  providedIn: 'root'
})
export class NotasAlumnoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Extraer array de respuesta paginada o directa
   */
  private extractArray<T>(data: any): T[] {
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    return [];
  }

  /**
   * Obtener nota por ID
   */
  getById(id: number): Observable<NotasAlumnoDTO> {
    return this.http.get<NotasAlumnoDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.getById(id)}`
    );
  }

  /**
   * Obtener notas por DetalleMatricula (alumno + materia específica)
   * NUEVO: Método principal para cargar notas
   */
  getByDetalleMatricula(idDetalleMatricula: number): Observable<NotasAlumnoDTO[]> {
    return this.http.get<IResponse<any>>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.getByDetalleMatricula(idDetalleMatricula)}`
    ).pipe(map(r => this.extractArray<NotasAlumnoDTO>(r.data)));
  }

  /**
   * Obtener notas por Matricula y Materia
   * Alternativa conveniente si no se tiene idDetalleMatricula
   */
  getByMatriculaYMateria(
    idMatricula: number,
    idDetalleMalla: number
  ): Observable<NotasAlumnoDTO[]> {
    return this.http.get<IResponse<any>>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.getByMatriculaYMateria(idMatricula, idDetalleMalla)}`
    ).pipe(map(r => this.extractArray<NotasAlumnoDTO>(r.data)));
  }

  /**
   * Obtener notas por malla/paralelo con filtros opcionales
   * Endpoint: GET /NotasAlumno/ByMallaParalelo/{idMallaParalelo}
   */
  getByMallaParalelo(
    idMallaParalelo: number,
    filtros?: {
      idDetalleMatricula?: number;
      idDetalleMalla?: number;
      idMatricula?: number;
    }
  ): Observable<NotasAlumnoDTO[]> {
    let params = new HttpParams();

    if (filtros?.idDetalleMatricula != null) {
      params = params.set('idDetalleMatricula', filtros.idDetalleMatricula.toString());
    }
    if (filtros?.idDetalleMalla != null) {
      params = params.set('idDetalleMalla', filtros.idDetalleMalla.toString());
    }
    if (filtros?.idMatricula != null) {
      params = params.set('idMatricula', filtros.idMatricula.toString());
    }

    return this.http.get<IResponse<any>>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.getByMallaParalelo(idMallaParalelo)}`,
      { params }
    ).pipe(map(r => this.extractArray<NotasAlumnoDTO>(r.data)));
  }

  /**
   * Obtener todas las notas de una matricula
   * @deprecated Usar getByDetalleMatricula o getByMatriculaYMateria
   */
  getByMatricula(idMatricula: number): Observable<NotasAlumnoDTO[]> {
    return this.http.get<NotasAlumnoDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.getByMatricula(idMatricula)}`
    );
  }

  /**
   * Obtener notas por matricula y plantilla especifica
   */
  getByMatriculaYPlantilla(idMatricula: number, idPlantillaEvaluacion: number): Observable<NotasAlumnoDTO[]> {
    return this.http.get<NotasAlumnoDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.getByMatriculaYPlantilla(idMatricula, idPlantillaEvaluacion)}`
    );
  }

  /**
   * Obtener boletin completo del alumno
   */
  getBoletin(idMatricula: number): Observable<BoletinAlumnoDTO> {
    return this.http.get<BoletinAlumnoDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.getBoletin(idMatricula)}`
    );
  }

  /**
   * Crear nueva nota (dispara calculo automatico)
   */
  create(data: NotasAlumnoCreateDTO): Observable<NotasAlumnoDTO> {
    return this.http.post<NotasAlumnoDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.create}`,
      data
    );
  }

  /**
   * Crear notas de forma masiva
   */
  createMasivo(data: NotasMasivasDTO): Observable<NotasAlumnoDTO[]> {
    return this.http.post<NotasAlumnoDTO[]>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.createMasivo}`,
      data
    );
  }

  /**
   * Actualizar nota (dispara recalculo)
   */
  update(data: NotasAlumnoUpdateDTO): Observable<NotasAlumnoDTO> {
    return this.http.put<NotasAlumnoDTO>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.update}`,
      data
    );
  }

  /**
   * Eliminar nota
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.delete(id)}`
    );
  }

  /**
   * Forzar recalculo de todas las notas de una matricula/plantilla
   */
  recalcular(idMatricula: number, idPlantillaEvaluacion: number): Observable<boolean> {
    return this.http.post<boolean>(
      `${this.apiUrl}${API_ENDPOINTS.notas.notasAlumno.recalcular(idMatricula, idPlantillaEvaluacion)}`,
      {}
    );
  }
}
