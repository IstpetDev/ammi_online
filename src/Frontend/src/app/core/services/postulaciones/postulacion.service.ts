import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { PostulacionDTO, PostulacionCommand, PostulacionCompletaDTO, PersonaPostulacionDTO, CrearPostulacionRequestDTO, CrearPostulacionManualRequestDTO, PersonaPostulacionManualDTO, PostulacionByDocumentoDTO } from '../../../data/models/Entities';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';


// Interfaces para la respuesta de la API
interface PersonaSimple {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  documento: string;
  generosimple: { nombre: string };
  pinfo: {
    fechaNacimiento: string;
    estadocivil: { nombre: string } | null;
    sangre: any;
    nacionalidadetnica: { nombre: string } | null;
  };
  pdiscapacidad: any;
  pactividadeconomica: any;
  pcontacto: { tipocontacto: { detalle: string }; detalle: string } | null;
  pdocumentos: any;
  pdireccion: { direccionDomiciliaria: string } | null;
}

// Interface para cambiar estado de postulación
interface CambiarEstadoRequest {
  cambiarestado: {
    idPostulacion: number;
    idTipoEstadoAprobacion: number;
    observacionesRevision: string;
    idEvaluador: number;
    idMallaParalelo?: number;
  };
}

interface CambiarEstadoResponse {
  data: any;
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errores: any;
}

// Enum para los estados de postulación
export enum EstadoPostulacion {
  BORRADOR = 1,
  ESPERA_DOCUMENTOS = 2,
  ESPERA_APROBACION = 3,
  APROBADO = 4,
  RECHAZADO = 5,
  FINALIZADO = 6,
  DOCUMENTOS_REVISION = 7,
  CONTACTO_PERSONA = 8
}

export interface AdjuntoResponse {
  blob: Blob;
  fileName?: string;
  contentType?: string;
}

interface TipoEstadoAprobacionAPI {
  detalle: string;
}

interface Malla {
  detalle: string;
  curso: { detalle: string };
  tipooferta: any;
  mallaCiclo: {
    ciclo: {
      periodo: { detalle: string };
      regimen: { detalle: string };
      detalle: string;
      fechaInicioEstimada: any;
      fechaFinEstimada: any;
    };
  };
}

interface PostulacionAPI {
  idPostulacion: number;
  personasimple: PersonaSimple;
  tipoestadoaprobacion: TipoEstadoAprobacionAPI;
  malla: Malla;
}

interface PostulacionesAPIResponse {
  data: {
    items: PostulacionAPI[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errores: any;
}

// Interface for paginated response
export interface PaginatedPostulacionesResponse {
  items: PostulacionCompletaDTO[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// New interface for the simplified postulacion response
interface PostulacionSimple {
  idPostulacion: number;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  documento: string;
  fechaNacimiento: string;
  mallaDetalle: string;
  cursoDetalle: string;
  tipoOfertaDetalle: string;
  estadoDetalle: string;
  cicloActivoDetalle: string;
}

interface PostulacionesSimpleResponse {
  data: PostulacionSimple[];
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errores: any;
}

@Injectable({
  providedIn: 'root'
})
export class PostulacionService {


  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
  ) { }


  // Obtiene postulaciones (adaptador que soporta distintos formatos de respuesta del back)
  getAllPostulaciones(pageNumber: number , pageSize: number, idCiclo?: number, idMalla?: number, idOferta?: number, documento?: string, idEstado?: number, search?: string): Observable<PaginatedPostulacionesResponse> {
    let url = `${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.getAllPostulaciones}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (idCiclo && idCiclo > 0) {
      url += `&idCiclo=${idCiclo}`;
    }
    if (idMalla && idMalla > 0) {
      url += `&idMalla=${idMalla}`;
    }
    if (idEstado && idEstado > 0) {
      url += `&idEstado=${idEstado}`;
    }
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<any>(url).pipe(
      map(response => {
        // Caso 1: la API devuelve { data: [...] , isSuccess: true }
        if (response && Array.isArray(response.data)) {
          const items = response.data;
          const totalCount = response.totalCount ?? (items.length);
          return {
            items,
            totalCount,
            pageNumber: response.pageNumber ?? pageNumber,
            pageSize: response.pageSize ?? pageSize,
            totalPages: response.totalPages ?? 1,
            hasPreviousPage: response.hasPreviousPage ?? false,
            hasNextPage: response.hasNextPage ?? false
          } as PaginatedPostulacionesResponse;
        }

        // Caso 2: la API devuelve { data: { items: [...], totalCount: x, ... }, isSuccess: true }
        if (response && response.data && Array.isArray(response.data.items)) {
          const items = response.data.items;
          return {
            items,
            totalCount: response.data.totalCount ?? items.length,
            pageNumber: response.data.pageNumber ?? pageNumber,
            pageSize: response.data.pageSize ?? pageSize,
            totalPages: response.data.totalPages ?? 1,
            hasPreviousPage: response.data.hasPreviousPage ?? false,
            hasNextPage: response.data.hasNextPage ?? false
          } as PaginatedPostulacionesResponse;
        }

        // Caso 3: la API devuelve directamente un arreglo
        if (Array.isArray(response)) {
          const items = response;
          return {
            items,
            totalCount: items.length,
            pageNumber,
            pageSize,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false
          } as PaginatedPostulacionesResponse;
        }

        // Si no se reconoce el formato, devolver vacío
        return {
          items: [],
          totalCount: 0,
          pageNumber,
          pageSize,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false
        } as PaginatedPostulacionesResponse;
      })
    );
  }


  // Crear postulación externa
  crearPostulacionExterna(personaPostulacion: PersonaPostulacionDTO): Observable<any> {
    const request: CrearPostulacionRequestDTO = {
      personaPostulacion: personaPostulacion
    };
    return this.http.post(`${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.crearPostulacionExterna}`, request);
  }

  // Crear postulación manual
  crearPostulacionManual(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.crearPostulacionManual}`, payload);
  }

  // Actualizar postulación desde contacto
  actualizarPostulacionContacto(payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.actualizarPostulacionContacto}`, payload);
  }

  getDocumentosPersonalesByPersona(idPersona: number): Observable<any> {
    return this.http.get(`${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.getDocumentosPersonalesByPersona(idPersona)}`);
  }
  // Obtener postulaciones desde la API
  getPostulacionesFromAPI(): Observable<PostulacionCompletaDTO[]> {
    return this.http.get<any>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.getAllPostulaciones}?pageSize=10000`).pipe(
      map(response => {
        if (!response || !response.isSuccess) {
          throw new Error(response?.message || 'Error al obtener postulaciones');
        }

        let items: any[] = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            items = response.data;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            items = response.data.items;
          }
        }

        return items.map(item => {
          const nombreCompleto = `${item.primerNombre || ''} ${item.segundoNombre || ''} ${item.primerApellido || ''} ${item.segundoApellido || ''}`.trim();
          const edad = this.calcularEdad(item.fechaNacimiento);

          return {
            idPostulacion: item.idPostulacion,
            idPersonaPostulacion: item.idPostulacion, // Assuming same for now
            TipoDocumento: '', // Not available in new response
            Documento: item.documento,
            Genero: '', // Not available
            NombreCompleto: nombreCompleto,
            FechaNacimiento: item.fechaNacimiento,
            Edad: edad,
            EstadoCivil: '', // Not available
            NacionalidadEtnica: '', // Not available
            Parroquia: '', // Not available
            DireccionDomiciliaria: '', // Not available
            Ciclo: item.cicloActivoDetalle,
            Curso: item.cursoDetalle,
            OfertaAcademica: item.mallaDetalle,
            FechaPostulacion: '', // Not available
            Estado: item.estadoDetalle,
            DatosContactos: [] // Not available
          } as PostulacionCompletaDTO;
        });
      })
    );
  }

  // Obtener postulaciones filtradas por Ciclo y (opcional) Tipo de Oferta con paginación
  getPostulacionesByCicloAndOferta(idCiclo: number, idOferta?: number, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedPostulacionesResponse> {
    let url = `${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.getPostulacionBy}?IdCiclo=${idCiclo}&PageNumber=${pageNumber}&PageSize=${pageSize}`;
    if (idOferta && idOferta > 0) {
      url += `&IdOferta=${idOferta}`;
    }
    return this.http.get<PostulacionesAPIResponse>(url).pipe(
      map(response => {
        if (!response.isSuccess || !response.data) {
          throw new Error(response.message || 'Error al obtener postulaciones');
        }
        return {
          items: response.data.items,
          totalCount: response.data.totalCount,
          pageNumber: response.data.pageNumber,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages,
          hasPreviousPage: response.data.hasPreviousPage,
          hasNextPage: response.data.hasNextPage
        };
      })
    );
  }

  // Obtener postulación completa por documento (con información de malla)
  getPostulacionCompletaByDocumento(documento: string): Observable<PostulacionByDocumentoDTO> {
    return this.http.get<PostulacionesAPIResponse>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.getAllPostulaciones}?Documento=${documento}`).pipe(
      map(response => {
        if (!response.isSuccess || !response.data || response.data.items.length === 0) {
          throw new Error(response.message || 'Postulación no encontrada');
        }
        const item = response.data.items[0];

        // Verificar que la estructura básica existe
        if (!item) {
          throw new Error('Datos de postulación incompletos');
        }

        // Retornar directamente el item, asumiendo que la API ya devuelve la estructura correcta
        return item as PostulacionByDocumentoDTO;
      })
    );
  }

  // Obtener postulación por documento
  getPostulacionByDocumento(documento: string): Observable<PaginatedPostulacionesResponse> {
    return this.http.get<PostulacionesAPIResponse>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.getPostulacionBy}?Documento=${documento}`).pipe(
      map(response => {
        if (!response.isSuccess || !response.data) {
          throw new Error(response.message || 'Postulación no encontrada');
        }
        return {
          items: response.data.items,
          totalCount: response.data.totalCount,
          pageNumber: response.data.pageNumber,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages,
          hasPreviousPage: response.data.hasPreviousPage,
          hasNextPage: response.data.hasNextPage
        };
      })
    );
  }

  private calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  // Cambiar estado de postulación
  cambiarEstadoPostulacion(
    idPostulacion: number,
    idTipoEstadoAprobacion: number,
    observacionesRevision: string,
    idEvaluador: number,
    idMallaParalelo?: number
  ): Observable<any> {
    const request: CambiarEstadoRequest = {
      cambiarestado: {
        idPostulacion,
        idTipoEstadoAprobacion,
        observacionesRevision,
        idEvaluador,
        ...(idMallaParalelo && { idMallaParalelo })
      }
    };

    return this.http.post<CambiarEstadoResponse>(
      `${this.apiUrl}${API_ENDPOINTS.postulaciones.cambiarEstadoPostulacion.changeState}`,
      request
    ).pipe(
      map(response => {
        if (!response.isSuccess) {
          throw new Error(response.message || 'Error al cambiar el estado de la postulación');
        }
        return response;
      })
    );
  }

  // Subir adjunto
  uploadAdjunto(file: File): Observable<{ idAdjunto: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ idAdjunto: number }>(
      `${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.uploadAdjunto}`,
      formData
    );
  }

  // Crear documento personal
  createDocumentoPersonal(documentoPersonal: {
    idPersona: number;
    idTipoDocumentoPersonal: number;
    idAdjunto: number;
    codigoRequisito: string;
    estado: boolean | null;
    valorDato: boolean;
    observacion: string;
  }): Observable<any> {

    const formData = new FormData();

    // Crear array con un documento personal (mismo formato que el método con archivos)
    const documentosPersonales = [documentoPersonal];
    formData.append('DocumentosPersonalesJson', JSON.stringify(documentosPersonales));

    // NO agregar archivos para requisitos BOOL

    console.log('Enviando documento sin archivo:', documentosPersonales);
    console.log('URL:', `${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.uploadAdjunto}`);

    return this.http.post(
      `${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.uploadAdjunto}`,
      formData
    );
  }

  // Crear documento personal sin archivo (para requisitos BOOL)
  createDocumentoPersonalSinArchivo(documentoPersonal: {
    idPersona: number;
    idTipoDocumentoPersonal: number;
    idAdjunto: null;
    codigoRequisito: string;
    estado: boolean;
    valorDato: boolean;
    observacion: string;
  }): Observable<any> {
    const formData = new FormData();
    const documentosPersonales = [documentoPersonal];
    formData.append('DocumentosPersonalesJson', JSON.stringify(documentosPersonales));

    return this.http.post(
      `${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.uploadAdjunto}`,
      formData
    );
  }

  // Actualizar documento personal
  updateDocumentoPersonal(documentoPersonal: FormData | {
    idDocumentosPersonales: number;
    idPersona: number;
    idTipoDocumentoPersonal: number;
    codigoRequisito: string;
    estado: boolean | null;
    valorDato: boolean;
    observacion: string;
  }): Observable<any> {

    return this.http.put(
      `${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.updateDocumentoPersonal}`,
      documentoPersonal
    );
  }

  // Crear múltiples documentos personales con archivos
  createDocumentosPersonalesConArchivos(documentos: {
    documentoPersonal: {
      idPersona: number;
      idTipoDocumentoPersonal: number;
      codigoRequisito: string;
      estado: boolean | null;
      valorDato: boolean;
      observacion: string;
      tieneArchivo: boolean;
    };
    file: File;
  }[]): Observable<any> {
    const formData = new FormData();

    // Crear array de documentos personales
    const documentosPersonales = documentos.map(doc => doc.documentoPersonal);
    formData.append('DocumentosPersonalesJson', JSON.stringify(documentosPersonales));

    // Agregar archivos
    documentos.forEach((doc, index) => {
      formData.append('ArchivosDocumentos', doc.file);
    });

    console.log('Enviando documentos con archivos:', documentosPersonales);
    console.log('URL:', `${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.uploadAdjunto}`);

    return this.http.post(
      `${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.uploadAdjunto}`,
      formData
    );
  }

  // Eliminar documento personal
  deleteDocumentoPersonal(idDocumentosPersonales: number): Observable<any> {
    console.log('Eliminando documento personal ID:', idDocumentosPersonales);
    console.log('URL:', `${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.deleteDocumentoPersonal(idDocumentosPersonales)}`);

    return this.http.delete(
      `${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.deleteDocumentoPersonal(idDocumentosPersonales)}`
    ).pipe(
      map((response: any) => {
        if (!response.isSuccess) {
          throw new Error(response.message || 'Error al eliminar el documento personal');
        }
        return response;
      })
    );
  }

  // Obtener adjunto por ID junto con metadata de headers
  getAdjunto(idAdjunto: number): Observable<AdjuntoResponse> {
    return this.http.get(`${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.getAdjunto(idAdjunto)}`, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((response) => {
        let rawBlob = response.body as Blob;
        const contentDisposition = response.headers.get('content-disposition');
        const fileName = this.extractFileNameFromContentDisposition(contentDisposition) || undefined;
        let contentType = (response.headers.get('content-type') || rawBlob?.type || '').toLowerCase() || undefined;

        const inferredType = this.getMimeTypeFromFileName(fileName);
        if (inferredType && (!contentType || contentType === 'application/octet-stream' || contentType === 'binary/octet-stream')) {
          contentType = inferredType;
        }

        // Crear blob re-tipado si el tipo MIME fue inferido o ajustado
        let blob = rawBlob;
        if (rawBlob && contentType && rawBlob.type !== contentType) {
          blob = new Blob([rawBlob], { type: contentType });
        }

        return {
          blob,
          fileName,
          contentType
        };
      })
    );
  }

  private getMimeTypeFromFileName(fileName?: string): string | null {
    if (!fileName) return null;
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'txt': return 'text/plain';
      default: return null;
    }
  }

  private extractFileNameFromContentDisposition(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;

    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (filenameStarMatch?.[1]) {
      try {
        return decodeURIComponent(filenameStarMatch[1].replace(/"/g, '').trim());
      } catch {
        return filenameStarMatch[1].replace(/"/g, '').trim();
      }
    }

    const filenameMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
    if (filenameMatch?.[1]) {
      return filenameMatch[1].trim();
    }

    return null;
  }

  // Eliminar adjunto por ID
  deleteAdjunto(idAdjunto: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.deleteAdjunto(idAdjunto)}`
    ).pipe(
      map((response: any) => {
        if (response?.isSuccess === false) {
          throw new Error(response.message || 'Error al eliminar el adjunto');
        }
        return response;
      })
    );
  }

  // Actualizar malla de una postulación
  updateMalla(idPostulacion: number, idMalla: number): Observable<any> {
    const url = `${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.updateMalla(idPostulacion)}`;
    const body = { idMalla };

    return this.http.put(url, body).pipe(
      map((response: any) => {
        if (!response.isSuccess) {
          throw new Error(response.message || 'Error al actualizar la malla');
        }
        return response;
      })
    );
  }

  // Eliminar postulación por ID
  eliminarPostulacion(idPostulacion: number): Observable<any> {
    const url = `${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.eliminarPostulacion(idPostulacion)}`;
    return this.http.delete(url).pipe(
      map((response: any) => {
        if (!response.isSuccess) {
          throw new Error(response.message || 'Error al eliminar la postulación');
        }
        return response;
      })
    );
  }

  // Actualizar datos básicos de la persona vinculada a la postulación
  actualizarDatosBasicosPostulante(idPostulacion: number, data: {
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido?: string;
    documento: string;
    fechaNacimiento?: string;
    idGenero?: number;
  }): Observable<any> {
    const url = `${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.actualizarDatosBasicos(idPostulacion)}`;
    return this.http.put(url, data).pipe(
      map((response: any) => {
        if (!response.isSuccess) {
          throw new Error(response.message || 'Error al actualizar los datos del postulante');
        }
        return response;
      })
    );
  }
}