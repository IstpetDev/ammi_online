import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MatriculaDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';
import {
  MatriculaConDetalleDTO,
  HistorialAcademicoDTO,
  AlumnoParaleloDTO,
  DetalleMatriculaConAlumnoDTO
} from '../../../data/models/matricula';

export interface PaginatedMatriculasResponse {
  items: MatriculaDTO[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MatriculaService {

  constructor(private http: HttpClient) { }

  private extractArray<T>(data: any): T[] {
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    return [];
  }

  /**
   * Obtener resumen de notas de una matrícula
   * Endpoint: GET /api/Matricula/{id}/notas
   */
  getNotasByMatricula(idMatricula: number): Observable<any | null> {
    return this.http.get<IResponse<any>>(
      `${API_BASE_URL}/api/Matricula/${idMatricula}/notas`
    ).pipe(map(r => r.data || null));
  }

  /**
   * Obtener una matrícula por su ID
   * Endpoint: GET /api/Matricula/{id}
   */
  getById(idMatricula: number): Observable<MatriculaDTO | null> {
    return this.http.get<IResponse<MatriculaDTO>>(
      `${API_BASE_URL}${API_ENDPOINTS.postulaciones.matricula.getById(idMatricula)}`
    ).pipe(map(r => r.data || null));
  }

  /**
   * Obtener todas las matrículas desde el API con filtros opcionales
   * Endpoint: GET /api/Matricula
   */
  getAllMatriculas(pageSize: number, pageNumber: number, idCiclo?: number, idOfertaAcademica?: number, documentoNombre?: string): Observable<MatriculaDTO[]> {
    return this.http.get<IResponse<PaginatedMatriculasResponse>>(
      `${API_BASE_URL}${API_ENDPOINTS.postulaciones.matricula.getAll(pageSize, pageNumber, idCiclo, idOfertaAcademica, documentoNombre)}`
    ).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          const data = response.data as any;
          return (Array.isArray(data) ? data : data.items) || [];
        }
        return [];
      })
    );
  }

  /**
   * Obtener todas las matrículas paginadas con metadatos de paginación
   * Endpoint: GET /api/Matricula
   */
  getAllMatriculasPaginated(pageSize: number, pageNumber: number, idCiclo?: number, idOfertaAcademica?: number, documentoNombre?: string, idMalla?: number): Observable<PaginatedMatriculasResponse> {
    return this.http.get<IResponse<PaginatedMatriculasResponse>>(
      `${API_BASE_URL}${API_ENDPOINTS.postulaciones.matricula.getAll(pageSize, pageNumber, idCiclo, idOfertaAcademica, documentoNombre, idMalla)}`
    ).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          const data = response.data as any;
          if (Array.isArray(data)) {
            return {
              items: data,
              totalCount: data.length,
              pageNumber,
              pageSize,
              totalPages: Math.ceil(data.length / pageSize),
              hasPreviousPage: pageNumber > 1,
              hasNextPage: false
            };
          }
          return {
            items: data.items || [],
            totalCount: data.totalCount ?? 0,
            pageNumber: data.pageNumber ?? pageNumber,
            pageSize: data.pageSize ?? pageSize,
            totalPages: data.totalPages ?? Math.ceil((data.totalCount || 0) / pageSize),
            hasPreviousPage: data.hasPreviousPage ?? false,
            hasNextPage: data.hasNextPage ?? false
          };
        }
        return {
          items: [],
          totalCount: 0,
          pageNumber,
          pageSize,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false
        };
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
   * Obtener matrículas por malla/paralelo (nuevo endpoint)
   * Endpoint: GET /api/Matricula/ByMallaParalelo/{idMallaParalelo}
   */
  getByMallaParalelo(idMallaParalelo: number): Observable<any[]> {
    return this.http.get<IResponse<any>>(
      `${API_BASE_URL}${API_ENDPOINTS.postulaciones.matricula.getByMallaParalelo(idMallaParalelo)}`
    ).pipe(
      map(r => this.extractArray<any>(r.data))
    );
  }

  /**
   * Obtener DetalleMatricula por malla/paralelo para una materia específica
   * Este es el método principal para cargar alumnos en el componente de calificaciones
   */
  getDetallesMatriculaByMallaParaleloYMateria(
    idMallaParalelo: number,
    idDetalleMalla: number
  ): Observable<DetalleMatriculaConAlumnoDTO[]> {
    return this.http.get<IResponse<any>>(
      `${API_BASE_URL}${API_ENDPOINTS.postulaciones.matricula.getByMallaParaleloYMateria(idMallaParalelo, idDetalleMalla)}`
    ).pipe(
      map(r => this.extractArray<DetalleMatriculaConAlumnoDTO>(r.data))
    );
  }

  /**
   * Obtener alumnos de un paralelo con datos para ingreso de notas
   * @deprecated Usar getDetallesMatriculaByParaleloYMateria en su lugar
   */
  getAlumnosByParalelo(idParalelo: number): Observable<AlumnoParaleloDTO[]> {
    return this.http.get<IResponse<any>>(
      `${API_BASE_URL}/api/Matricula/ByParalelo/${idParalelo}`
    ).pipe(map(r => {
      const data = r.data;
      return Array.isArray(data) ? data : (data?.items ?? []);
    }));
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
   * Obtener historiales completos de todos los alumnos en un paralelo
   * Para cargar datos completos en calificaciones
   */
  getHistorialesCompletoByParalelo(idParalelo: number): Observable<HistorialAcademicoDTO[]> {
    return this.http.get<IResponse<HistorialAcademicoDTO[]>>(
      `${API_BASE_URL}/api/Matricula/ByParalelo/${idParalelo}/Completo`
    ).pipe(map(r => r.data || []));
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
   * Obtener matrículas por malla con soporte de paginación.
   * Se usa pageSize=1000 por defecto para recuperar todos los registros en una sola petición.
   * Endpoint: /api/Matricula/ByMalla/{idMalla}?PageNumber=1&PageSize=1000
   */
  getByMalla(idMalla: number, pageNumber: number = 1, pageSize: number = 1000): Observable<MatriculaDTO[]> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.postulaciones.matricula.getByMalla(idMalla)}?PageNumber=${pageNumber}&PageSize=${pageSize}`;
    return this.http.get<any>(url).pipe(
      map(r => {
        // Respuesta directa como array
        if (Array.isArray(r)) return r as MatriculaDTO[];
        // IResponse con data paginada (items)
        if (r?.data?.items && Array.isArray(r.data.items)) return r.data.items as MatriculaDTO[];
        // IResponse con data como array
        if (r?.data && Array.isArray(r.data)) return r.data as MatriculaDTO[];
        // Paginación directa (sin IResponse wrapper)
        if (r?.items && Array.isArray(r.items)) return r.items as MatriculaDTO[];
        return [];
      })
    );
  }

  /**
   * Obtener matrículas por malla con paginación completa (devuelve metadata).
   * Útil cuando se necesita totalCount, hasNextPage, etc.
   */
  getByMallaPaginated(idMalla: number, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedMatriculasResponse> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.postulaciones.matricula.getByMalla(idMalla)}?PageNumber=${pageNumber}&PageSize=${pageSize}`;
    return this.http.get<any>(url).pipe(
      map(r => {
        const paginated: PaginatedMatriculasResponse = {
          items: [],
          totalCount: 0,
          pageNumber,
          pageSize,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false
        };
        if (Array.isArray(r)) { paginated.items = r; paginated.totalCount = r.length; return paginated; }
        if (r?.data?.items) return { ...paginated, ...r.data } as PaginatedMatriculasResponse;
        if (r?.items) return { ...paginated, ...r } as PaginatedMatriculasResponse;
        return paginated;
      })
    );
  }

  /**
   * Actualizar una matrícula
   * Endpoint: PUT /api/Matricula/{id}
   */
  updateMatricula(idMatricula: number, matricula: Partial<MatriculaDTO>): Observable<any> {
    return this.http.put(`${API_BASE_URL}/api/Matricula/${idMatricula}`, matricula);
  }

  /**
   * Actualizar matrícula con paralelo
   * Endpoint: PUT /api/Matricula/Actualizar
   */
  actualizarMatricula(data: {
    idMatricula: number;
    idUsuarioAlumno: number;
    idMallaParalelo: number;
    idEstadoMatricula: number;
  }): Observable<any> {
    return this.http.put<IResponse<any>>(`${API_BASE_URL}/api/Matricula/Actualizar`, data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Crear una nueva matrícula
   * Endpoint: POST /api/Matricula
   * Requiere autenticación.
   */
  crearMatricula(data: { idPersona: number; idMalla: number; idMallaParalelo: number }): Observable<any> {
    return this.http.post<IResponse<any>>(`${API_BASE_URL}/api/Matricula`, data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Registrar nota del examen remedial para un detalle de matrícula.
   * Endpoint: PUT /api/Matricula/DetalleMatricula/{idDetalleMatricula}/Remedial
   * Body: number (nota remedial, 0-10)
   */
  registrarRemedial(idDetalleMatricula: number, notaRemedial: number): Observable<boolean> {
    return this.http.put<IResponse<boolean>>(
      `${API_BASE_URL}/api/Matricula/DetalleMatricula/${idDetalleMatricula}/Remedial`,
      { notaRemedial }
    ).pipe(map(r => r.data ?? false));
  }

}