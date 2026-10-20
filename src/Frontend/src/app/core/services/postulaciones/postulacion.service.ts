import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { PostulacionDTO, PostulacionCommand, PostulacionCompletaDTO,PersonaPostulacionDTO , CrearPostulacionRequestDTO, CrearPostulacionManualRequestDTO, PersonaPostulacionManualDTO, PostulacionByDocumentoDTO } from '../../../data/models/Entities';
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
  FINALIZADO = 6
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
  data: PostulacionAPI[];
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errores: any;
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

  getDocumentosPersonalesByPersona(idPersona: number): Observable<any> {
    return this.http.get(`${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.getDocumentosPersonalesByPersona(idPersona)}`);
  }
  // Obtener postulaciones desde la API
  getPostulacionesFromAPI(): Observable<PostulacionCompletaDTO[]> {
    return this.http.get<PostulacionesSimpleResponse>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.getAllPostulaciones}`).pipe(
      map(response => {
        if (!response.isSuccess || !response.data) {
          throw new Error(response.message || 'Error al obtener postulaciones');
        }
        return response.data.map(item => {
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

  // Obtener postulación completa por documento (con información de malla)
  getPostulacionCompletaByDocumento(documento: string): Observable<PostulacionByDocumentoDTO> {
    return this.http.get<PostulacionesAPIResponse>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.getAllPostulaciones}?Documento=${documento}`).pipe(
      map(response => {
        if (!response.isSuccess || !response.data || response.data.length === 0) {
          throw new Error(response.message || 'Postulación no encontrada');
        }
        const item = response.data[0];

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
  getPostulacionByDocumento(documento: string): Observable<PostulacionByDocumentoDTO> {
    return this.http.get<any>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.postulacion.getPostulacionBy}?Documento=${documento}`).pipe(
      map(response => {
        if (!response.isSuccess || !response.data) {
          throw new Error(response.message || 'Postulación no encontrada');
        }
        // La respuesta viene como array, tomamos el primer elemento
        const item = Array.isArray(response.data) ? response.data[0] : response.data;
        if (!item) {
          throw new Error('Postulación no encontrada');
        }

        // Directamente retornar el item que ya tiene la estructura correcta
        return item as PostulacionByDocumentoDTO;
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
    idEvaluador: number
  ): Observable<any> {
    const request: CambiarEstadoRequest = {
      cambiarestado: {
        idPostulacion,
        idTipoEstadoAprobacion,
        observacionesRevision,
        idEvaluador
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

  // Obtener adjunto por ID
  getAdjunto(idAdjunto: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}${API_ENDPOINTS.postulaciones.documentos.getAdjunto(idAdjunto)}`, {
      responseType: 'blob'
    });
  }
}