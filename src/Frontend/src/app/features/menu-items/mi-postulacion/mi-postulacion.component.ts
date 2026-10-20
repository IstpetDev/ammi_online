import { Component, OnInit, ViewChild, ElementRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';
import { forkJoin } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { PostulacionService } from '../../../core/services/postulaciones';
import { RequisitosService } from '../../../core/services/postulaciones/requisitos.service';
import { PostulacionCompletaDTO, RequisitosDTO, PersonaDTO, PostulacionByDocumentoDTO } from '../../../data/models/Entities';
import { AuthService } from '../../../core/auth/index';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PersonaService } from '../../../core/services/postulaciones/persona.service';

interface RequisitoExtendido extends RequisitosDTO {
  completado?: boolean;
  documentoExistente?: any;
}

interface DocumentoTemp {
  requisito: RequisitoExtendido;
  file?: File; // Opcional para requisitos BOOL
  idTipoDocumentoPersonal: number;
  observacion: string;
  // Para requisitos BOOL
  esRequisitoBool?: boolean;
  valorBool?: boolean;
}

@Pipe({
  name: 'safe',
  standalone: true
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }
  
  transform(url: string, type: string): SafeResourceUrl {
    if (type === 'resourceUrl') {
      // Para blob URLs, usar bypassSecurityTrustResourceUrl
      if (url && url.startsWith('blob:')) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
      // Para otras URLs, usar bypassSecurityTrustResourceUrl
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    return url;
  }
}

@Component({
  selector: 'app-mi-postulacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, ToastModule, SafePipe],
  providers: [MessageService],
  templateUrl: './mi-postulacion.component.html',
  styleUrls: ['./mi-postulacion.component.css']
})
export class MiPostulacionComponent implements OnInit, OnDestroy {

  documento: string | null = null;
  postulacion: PostulacionByDocumentoDTO | null = null;
  persona: PersonaDTO | null = null;
  requisitos: RequisitoExtendido[] = [];
  documentosPersonales: any[] = [];
  loading = true;
  selectedRequisito: RequisitoExtendido | null = null;
  documentosPendientes: DocumentoTemp[] = [];
  uploading = false;
  previewUrl: string | null = null;
  previewFileName: string | null = null;
  previewFileType: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  private router = inject(Router);
  private postulacionService = inject(PostulacionService);
  private requisitosService = inject(RequisitosService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private personaService = inject(PersonaService);

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.username) {
      this.documento = currentUser.username;
      this.loadPostulacionDetails();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener información del usuario'
      });
      this.loading = false;
    }
  }

  loadPostulacionDetails(): void {
    if (!this.documento) return;

    this.loading = true;

    this.loadPostulacionGeneral();
  }

  private loadPostulacionGeneral(): void {
    // Cargar postulación para vista general
    this.postulacionService.getPostulacionByDocumento(this.documento!).subscribe({
      next: (postulacion) => {
        this.postulacion = postulacion;
        this.loadDataPerson();
        // Cargar requisitos después de que ambos datos estén disponibles
        this.loadRequisitos();
      },
      error: (err) => {
        console.error('Error al cargar postulación:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar tu postulación'
        });
        this.loading = false;
      }
    });
  }

  loadRequisitos(): void {
    if (!this.postulacion?.malla?.idMalla) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo determinar la malla para cargar requisitos'
      });
      this.loading = false;
      return;
    }

    const idMalla = this.postulacion.malla.idMalla;
    console.log('Cargando requisitos para malla ID:', idMalla);

    this.requisitosService.getRequisitosByMalla(idMalla).subscribe({
      next: (requisitos) => {
        console.log('Requisitos cargados:', requisitos);
        console.log('Tipo de respuesta:', typeof requisitos);
        console.log('Es array:', Array.isArray(requisitos));
        this.requisitos = requisitos;
        this.loadDocumentosPersonalesByPersona();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar requisitos:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los requisitos'
        });
        this.loading = false;
      }
    });
  }

  loadDocumentosPersonalesByPersona(): void {
    if (!this.persona) return;
    this.postulacionService.getDocumentosPersonalesByPersona(this.persona.idPersona!).subscribe({
      next: (documentos) => {
        console.log('Documentos personales obtenidos:', documentos);
        this.documentosPersonales = documentos?.data || [];
        this.sincronizarRequisitosConDocumentos();
      },
      error: (err) => {
        console.error('Error al cargar documentos personales:', err);
        this.documentosPersonales = [];
        this.sincronizarRequisitosConDocumentos();
      }
    });
  }

  private sincronizarRequisitosConDocumentos(): void {
    // Marcar en cada requisito si ya tiene documento subido
    this.requisitos.forEach(requisito => {
      const documentoExistente = this.documentosPersonales.find(
        doc => doc.codigoRequisito === requisito.idRequisitos?.toString()
      );
      
      // Añadir propiedad para indicar si está completado
      requisito.completado = !!documentoExistente;
      requisito.documentoExistente = documentoExistente;
    });
    
  }

  loadDataPerson(): void {
    if (!this.documento) return;

    this.personaService.getPersonaByDocumento(this.documento).subscribe({
      next: (personas) => {
        if (personas && personas.length > 0) {
          this.persona = personas[0];
        }
      },
      error: (err) => {
        console.error('Error al cargar datos de persona:', err);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }

  // Métodos para manejar documentos
  subirDocumento(requisito: RequisitoExtendido): void {
    this.selectedRequisito = requisito;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.selectedRequisito) {
      // Verificar si ya existe un documento para este requisito
      const existingIndex = this.documentosPendientes.findIndex(
        doc => doc.requisito.idRequisitos === this.selectedRequisito!.idRequisitos
      );

      const nuevoDoc: DocumentoTemp = {
        requisito: this.selectedRequisito,
        file: file,
        idTipoDocumentoPersonal: 2, // Valor por defecto, ajustar según necesidad
        observacion: this.selectedRequisito.detalle || '',
        esRequisitoBool: false // Marcar como requisito ADJUNTO
      };

      if (existingIndex >= 0) {
        // Reemplazar documento existente
        this.documentosPendientes[existingIndex] = nuevoDoc;
        this.messageService.add({
          severity: 'info',
          summary: 'Actualizado',
          detail: `Documento "${this.selectedRequisito.detalle}" actualizado. Presiona "Confirmar Datos" para subir.`
        });
      } else {
        // Agregar nuevo documento
        this.documentosPendientes.push(nuevoDoc);
        this.messageService.add({
          severity: 'success',
          summary: 'Agregado',
          detail: `Documento "${this.selectedRequisito.detalle}" agregado. Presiona "Confirmar Datos" para subir.`
        });
      }
    }
    // Reset the input
    this.fileInput.nativeElement.value = '';
    this.selectedRequisito = null;
  }

  verDocumento(requisito: RequisitoExtendido): void {
    // Primero verificar si hay documento pendiente (no subido aún)
    const docPendiente = this.getDocumentoPendiente(requisito);
    if (docPendiente && docPendiente.file) {
      // Limpiar URL anterior si existe
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      // Crear URL para previsualización
      this.previewUrl = URL.createObjectURL(docPendiente.file);
      this.previewFileName = docPendiente.file.name;
      this.previewFileType = docPendiente.file.type;
      return;
    }

    // Si no hay pendiente, verificar si ya está subido (completado)
    if (requisito.completado && requisito.documentoExistente) {
      if (requisito.documentoExistente.idAdjunto) {
        // Limpiar URL anterior si existe
        if (this.previewUrl) {
          URL.revokeObjectURL(this.previewUrl);
        }
        // Descargar archivo como blob para previsualización usando el servicio
        this.postulacionService.getAdjunto(requisito.documentoExistente.idAdjunto).subscribe({
          next: (blob: Blob) => {
            // Crear una URL de objeto para el blob
            this.previewUrl = URL.createObjectURL(blob);
            const fileName = requisito.documentoExistente.observacion || 'Documento';
            this.previewFileName = fileName;
            this.previewFileType = blob.type;
          },
          error: (err) => {
            console.error('Error descargando documento:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cargar el documento para previsualización'
            });
          }
        });
      } else {
        this.messageService.add({
          severity: 'info',
          summary: 'Información',
          detail: 'No hay ID de adjunto disponible'
        });
      }
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Información',
        detail: 'No hay documento cargado para este requisito'
      });
    }
  }



  private verificarTipoArchivo(nombreArchivo: string): void {
    const extension = nombreArchivo.toLowerCase().split('.').pop();
    const tiposPreviewables = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'];
    
    if (!tiposPreviewables.includes(extension || '')) {
      this.messageService.add({
        severity: 'info',
        summary: 'Tipo de archivo',
        detail: `Los archivos .${extension} no se pueden previsualizar. Se muestra información del documento.`,
        life: 5000
      });
    }
  }

  // Métodos auxiliares para el template
  esTipoPrevisualizable(fileName: string | null, mimeType?: string | null): boolean {
    if (mimeType) {
      const tiposPreviewables = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'text/plain'];
      return tiposPreviewables.includes(mimeType);
    }
    if (!fileName) return false;
    const extension = fileName.toLowerCase().split('.').pop();
    const tiposPreviewables = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'];
    return tiposPreviewables.includes(extension || '');
  }

  obtenerTipoArchivo(fileName: string | null, mimeType?: string | null): string {
    if (mimeType) {
      switch (mimeType) {
        case 'application/pdf':
          return 'Documento PDF';
        case 'image/jpeg':
        case 'image/jpg':
          return 'Imagen JPEG';
        case 'image/png':
          return 'Imagen PNG';
        case 'image/gif':
          return 'Imagen GIF';
        case 'text/plain':
          return 'Archivo de texto';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return 'Documento Word (DOCX)';
        case 'application/msword':
          return 'Documento Word (DOC)';
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          return 'Hoja de cálculo Excel';
        case 'application/vnd.ms-powerpoint':
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
          return 'Presentación PowerPoint';
        default:
          return `Archivo ${mimeType}`;
      }
    }
    if (!fileName) return 'Desconocido';
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return 'Documento PDF';
      case 'docx':
        return 'Documento Word (DOCX)';
      case 'doc':
        return 'Documento Word (DOC)';
      case 'jpg':
      case 'jpeg':
        return 'Imagen JPEG';
      case 'png':
        return 'Imagen PNG';
      case 'gif':
        return 'Imagen GIF';
      case 'txt':
        return 'Archivo de texto';
      case 'xlsx':
        return 'Hoja de cálculo Excel';
      case 'pptx':
        return 'Presentación PowerPoint';
      default:
        return `Archivo .${extension?.toUpperCase()}`;
    }
  }

  confirmarDatos(): void {
    if (this.documentosPendientes.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay documentos o selecciones para enviar'
      });
      return;
    }

    if (!this.persona?.idPersona) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener información de la persona'
      });
      return;
    }

    this.uploading = true;
    
    // Separar documentos ADJUNTO y requisitos BOOL
    const documentosAdjunto = this.documentosPendientes.filter(doc => !doc.esRequisitoBool);
    const requisitosBool = this.documentosPendientes.filter(doc => doc.esRequisitoBool);
    
    const requests: any[] = [];

    // Preparar documentos con archivos (ADJUNTO)
    if (documentosAdjunto.length > 0) {
      const documentosParaEnviar = documentosAdjunto.map(doc => ({
        documentoPersonal: {
          idPersona: this.persona!.idPersona!,
          idTipoDocumentoPersonal: doc.idTipoDocumentoPersonal,
          codigoRequisito: (doc.requisito.idRequisitos || 0).toString(),
          estado: null,
          valorDato: true,
          observacion: doc.observacion,
          tieneArchivo: true
        },
        file: doc.file!
      }));
      requests.push(this.postulacionService.createDocumentosPersonalesConArchivos(documentosParaEnviar));
    }

    // Preparar requisitos BOOL (sin archivos)
    requisitosBool.forEach(doc => {
      const documentoData = {
        idPersona: this.persona!.idPersona!,
        idTipoDocumentoPersonal: doc.idTipoDocumentoPersonal,
        idAdjunto: 0,
        codigoRequisito: (doc.requisito.idRequisitos || 0).toString(),
        estado: null,
        valorDato: doc.valorBool!,
        observacion: doc.observacion
      };
      requests.push(this.postulacionService.createDocumentoPersonal(documentoData));
    });

    // Ejecutar todas las peticiones
    if (requests.length > 0) {
      forkJoin(requests).subscribe({
        next: (responses) => {
          this.uploading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Todos los documentos y selecciones se enviaron correctamente (${this.documentosPendientes.length} elementos)`
          });
          this.documentosPendientes = [];
          // Recargar documentos personales y requisitos para sincronizar
          this.loadDocumentosPersonalesByPersona();
        },
        error: (err) => {
          console.error('Error enviando datos:', err);
          this.uploading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al enviar algunos documentos o selecciones'
          });
        }
      });
    }
  }



  getDocumentoPendiente(requisito: RequisitoExtendido): DocumentoTemp | undefined {
    return this.documentosPendientes.find(doc => doc.requisito.idRequisitos === requisito.idRequisitos);
  }

  eliminarDocumentoPendiente(requisito: RequisitoExtendido): void {
    const index = this.documentosPendientes.findIndex(
      doc => doc.requisito.idRequisitos === requisito.idRequisitos
    );
    if (index >= 0) {
      const docEliminado = this.documentosPendientes[index];
      // Limpiar previsualización si era este documento
      if (docEliminado.file && this.previewFileName === docEliminado.file.name) {
        if (this.previewUrl) {
          URL.revokeObjectURL(this.previewUrl);
        }
        this.previewUrl = null;
        this.previewFileName = null;
      }
      
      this.documentosPendientes.splice(index, 1);
      this.messageService.add({
        severity: 'info',
        summary: 'Eliminado',
        detail: `${docEliminado.esRequisitoBool ? 'Selección' : 'Documento'} "${requisito.detalle}" eliminado de la lista`
      });
    }
  }

  // Eliminar documento completado del servidor
  eliminarDocumentoCompletado(requisito: RequisitoExtendido): void {
    if (!requisito.documentoExistente?.idDocumentosPersonales) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el ID del documento para eliminar'
      });
      return;
    }

    this.messageService.add({
      severity: 'warn',
      summary: 'Confirmación requerida',
      detail: `¿Estás seguro que deseas eliminar "${requisito.detalle}"?`,
      sticky: true,
      closable: false,
      data: {
        idDocumentosPersonales: requisito.documentoExistente.idDocumentosPersonales,
        requisito: requisito
      }
    });

    // Usar setTimeout para mostrar botones de confirmación después del toast
    setTimeout(() => {
      this.confirmarEliminacionDocumento(requisito.documentoExistente.idDocumentosPersonales, requisito);
    }, 100);
  }

  private confirmarEliminacionDocumento(idDocumentosPersonales: number, requisito: RequisitoExtendido): void {
    // Limpiar el toast anterior
    this.messageService.clear();

    this.postulacionService.deleteDocumentoPersonal(idDocumentosPersonales).subscribe({
      next: (response) => {
        // Actualizar el estado local del requisito
        requisito.completado = false;
        requisito.documentoExistente = undefined;

        // Limpiar previsualización si era este documento
        if (this.previewUrl) {
          URL.revokeObjectURL(this.previewUrl);
          this.previewUrl = null;
          this.previewFileName = null;
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: `Documento "${requisito.detalle}" eliminado correctamente`
        });

        // Recargar documentos para sincronizar
        this.loadDocumentosPersonalesByPersona();
      },
      error: (err) => {
        console.error('Error eliminando documento:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el documento del servidor'
        });
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar URL de previsualización al destruir el componente
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  // Método para calcular la edad
  calcularEdad(fechaNacimiento: string | undefined): string {
    if (!fechaNacimiento) return '';

    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad + ' años';
  }

  // Métodos para manejar requisitos de tipo BOOL
  marcarRequisitoCumple(requisito: RequisitoExtendido, cumple: boolean): void {
    // Verificar si ya existe un documento pendiente para este requisito
    const existingIndex = this.documentosPendientes.findIndex(
      doc => doc.requisito.idRequisitos === requisito.idRequisitos
    );

    const documentoPendiente: DocumentoTemp = {
      requisito: requisito,
      idTipoDocumentoPersonal: 1,
      observacion: cumple ? 'Cumple con el requisito' : 'No cumple - Asesor se comunicará',
      esRequisitoBool: true,
      valorBool: cumple
    };

    if (existingIndex >= 0) {
      // Reemplazar selección existente
      this.documentosPendientes[existingIndex] = documentoPendiente;
    } else {
      // Agregar nueva selección
      this.documentosPendientes.push(documentoPendiente);
    }

    this.messageService.add({
      severity: cumple ? 'success' : 'info',
      summary: 'Selección Guardada',
      detail: cumple 
        ? `Marcaste "${requisito.detalle}" como cumplido. Presiona "Confirmar Datos" para enviar.`
        : `Marcaste "${requisito.detalle}" como no cumplido. Un asesor se comunicará contigo. Presiona "Confirmar Datos" para enviar.`,
      life: 4000
    });
  }

  // Verificar si un requisito BOOL tiene selección pendiente
  getSeleccionBoolPendiente(requisito: RequisitoExtendido): DocumentoTemp | undefined {
    return this.documentosPendientes.find(
      doc => doc.requisito.idRequisitos === requisito.idRequisitos && doc.esRequisitoBool
    );
  }

  // Eliminar selección BOOL pendiente
  eliminarSeleccionBoolPendiente(requisito: RequisitoExtendido): void {
    const index = this.documentosPendientes.findIndex(
      doc => doc.requisito.idRequisitos === requisito.idRequisitos && doc.esRequisitoBool
    );
    if (index >= 0) {
      this.documentosPendientes.splice(index, 1);
      this.messageService.add({
        severity: 'info',
        summary: 'Selección Eliminada',
        detail: `Selección para "${requisito.detalle}" eliminada`
      });
    }
  }
}