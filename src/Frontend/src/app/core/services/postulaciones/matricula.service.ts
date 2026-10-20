import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { MatriculaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';
import {
  MatriculaConDetalleDTO,
  HistorialAcademicoDTO,
  AlumnoParaleloDTO,
  DetalleMatriculaConAlumnoDTO
} from '../../../data/models/matricula';

@Injectable({
  providedIn: 'root'
})
export class MatriculaService {

  constructor(private http: HttpClient) { }

  /**
   * Obtener todas las matrículas desde el API
   * Endpoint: /api/Matricula
   */
  getAllMatriculas(): Observable<MatriculaDTO[]> {
    return this.http.get<IResponse<MatriculaDTO[]>>(`${API_BASE_URL}${API_ENDPOINTS.postulaciones.matricula.getAll}`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Obtener matrículas por alumno (idUsuario = idPersona)
   * Endpoint: /api/Matricula/ByAlumno/{idUsuario}
   */
  getMatriculasByAlumno(idUsuario: number): Observable<MatriculaDTO[]> {
    return this.http.get<IResponse<MatriculaDTO[]>>(`${API_BASE_URL}${API_ENDPOINTS.postulaciones.matricula.getByAlumno(idUsuario)}`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Obtener matriculas por paralelo (para docente - ver alumnos)
   */
  getByParalelo(idParalelo: number): Observable<MatriculaDTO[]> {
    return this.http.get<IResponse<MatriculaDTO[]>>(
      `${API_BASE_URL}/api/Matricula/ByParalelo/${idParalelo}`
    ).pipe(map(r => r.data || []));
  }

  /**
   * Obtener DetalleMatricula de un paralelo para una materia específica
   * Este es el método principal para cargar alumnos en el componente de calificaciones
   */
  getDetallesMatriculaByParaleloYMateria(
    idParalelo: number,
    idDetalleMalla: number
  ): Observable<DetalleMatriculaConAlumnoDTO[]> {
    return this.http.get<IResponse<DetalleMatriculaConAlumnoDTO[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.postulaciones.matricula.getByParaleloYMateria(idParalelo, idDetalleMalla)}`
    ).pipe(map(r => r.data || []));
  }

  /**
   * Obtener alumnos de un paralelo con datos para ingreso de notas
   * @deprecated Usar getDetallesMatriculaByParaleloYMateria en su lugar
   */
  getAlumnosByParalelo(idParalelo: number): Observable<AlumnoParaleloDTO[]> {
    return this.http.get<IResponse<AlumnoParaleloDTO[]>>(
      `${API_BASE_URL}/api/Matricula/ByParalelo/${idParalelo}`
    ).pipe(map(r => r.data || []));
  }

  /**
   * Obtener matriculas de un alumno con detalles
   */
  getByAlumno(idUsuario: number): Observable<MatriculaConDetalleDTO[]> {
    return this.http.get<IResponse<MatriculaConDetalleDTO[]>>(
      `${API_BASE_URL}/api/Matricula/ByAlumno/${idUsuario}`
    ).pipe(map(r => r.data || []));
  }

  /**
   * Obtener historial academico completo de un alumno
   * Este es el endpoint principal para mis-calificaciones
   */
  getHistorialCompleto(idUsuario: number): Observable<HistorialAcademicoDTO | null> {
    return this.http.get<IResponse<HistorialAcademicoDTO>>(
      `${API_BASE_URL}/api/Matricula/ByAlumno/${idUsuario}/Completo`
    ).pipe(map(r => r.data || null));
  }

  /**
   * Obtener matricula por ID con detalles
   */
  getByIdConDetalle(idMatricula: number): Observable<MatriculaConDetalleDTO | null> {
    return this.http.get<IResponse<MatriculaConDetalleDTO>>(
      `${API_BASE_URL}/api/Matricula/${idMatricula}/Detalle`
    ).pipe(map(r => r.data || null));
  }

  /**
   * Actualizar una matrícula
   * Endpoint: PUT /api/Matricula/{id}
   */
  updateMatricula(idMatricula: number, matricula: Partial<MatriculaDTO>): Observable<any> {
    return this.http.put(`${API_BASE_URL}/api/Matricula/${idMatricula}`, matricula);
  }



}