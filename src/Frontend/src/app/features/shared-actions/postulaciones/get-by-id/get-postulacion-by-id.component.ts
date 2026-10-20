import { Component, OnInit, ViewChild, ElementRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { PostulacionService, EstadoPostulacion } from '../../../../core/services/postulaciones';
import { RequisitosService } from '../../../../core/services/postulaciones/requisitos.service';
import { PostulacionCompletaDTO, RequisitosDTO, PersonaDTO, PostulacionByDocumentoDTO } from '../../../../data/models/Entities';
import { AuthService } from '../../../../core/auth/index';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PersonaService } from '../../../../core/services/postulaciones/persona.service';
import { MallaService } from '../../../../core/services/infrastructure/malla.service';
import { API_ENDPOINTS } from '../../../../core/constants/app.constants';

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
  selector: 'app-get-postulacion-by-id',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, ToastModule, ConfirmDialogModule, SafePipe],
  providers: [MessageService, ConfirmationService],
  templateUrl: './get-postulacion-by-id.component.html',
  styleUrls: ['./get-postulacion-by-id.component.css']
})
export class GetPostulacionByidComponent implements OnInit, OnDestroy {

  documento: string | null = null;
  postulacion: PostulacionCompletaDTO | null = null;
  postulacionByDocumento: PostulacionByDocumentoDTO | null = null;
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
  booleanRequisitos: { [key: number]: boolean } = {};

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postulacionService = inject(PostulacionService);
  private requisitosService = inject(RequisitosService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private personaService = inject(PersonaService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    const documentoParam = this.route.snapshot.paramMap.get('id');
    
    if (documentoParam) {
      this.documento = documentoParam;
      this.loadPostulacionDetails();
    }
  }



  loadPostulacionDetails(): void {
    if (!this.documento) return;

    this.loading = true;
        this.loadPostulacionGeneral();

    // Cargar postulación completa usando el servicio

  }

  private loadPostulacionGeneral(): void {
    // Cargar postulación para vista general
    this.postulacionService.getPostulacionByDocumento(this.documento!).subscribe({
      next: (postulacion) => {
        this.postulacionByDocumento = postulacion;
        this.loadDataPerson();
        this.loadRequisitos();
      },
      error: (err) => {
        console.error('Error al cargar postulación:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la postulación'
        });
        this.loading = false;
      }
    });
  }

  loadRequisitos(): void {
    console.log('Cargando requisitos para malla de la postulación:', this.postulacionByDocumento?.malla);
    if (!this.postulacionByDocumento?.malla?.idMalla) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo determinar la malla para cargar requisitos'
      });
      this.loading = false;
      return;
    }

    const idMalla = this.postulacionByDocumento.malla.idMalla;

    this.requisitosService.getRequisitosByMalla(idMalla).subscribe({
      next: (requisitos) => {
        this.requisitos = requisitos;
        this.loadDocumentosPersonalesByPersona();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar requisitos:', err);
        console.error('URL endpoint:', API_ENDPOINTS.postulaciones.requisitos.getByMalla(idMalla));
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
        this.documentosPersonales = documentos?.data || [];
        this.sincronizarRequisitosConDocumentos();
      },
      error: (err) => {
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
    this.router.navigate(['/dashboard/manage-postulations']);
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
        idTipoDocumentoPersonal: 2,
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

  onBooleanChange(requisito: RequisitoExtendido, value: boolean): void {
    if (requisito.idRequisitos) {
      this.booleanRequisitos[requisito.idRequisitos] = value;
    }
  }

  verDocumento(requisito: RequisitoExtendido): void {
    const doc = this.getDocumentoPendiente(requisito);
    if (doc && doc.file) {
      // Limpiar URL anterior si existe
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      // Crear URL para previsualización
      this.previewUrl = URL.createObjectURL(doc.file);
      this.previewFileName = doc.file.name;
      this.previewFileType = doc.file.type;
    } else if (requisito.documentoExistente) {
      // Intentar previsualización descargando como blob
      if (requisito.documentoExistente.idAdjunto) {
        // Limpiar URL anterior si existe
        if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(this.previewUrl);
        }
        // Descargar archivo como blob para previsualización usando el servicio
        this.postulacionService.getAdjunto(requisito.documentoExistente.idAdjunto).subscribe({
          next: (blob: Blob) => {
            this.previewUrl = URL.createObjectURL(blob);
            this.previewFileName = requisito.documentoExistente.observacion || 'Documento';
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

  confirmarDatos(): void {
    if (!this.persona?.idPersona) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener información de la persona'
      });
      return;
    }

    this.uploading = true;

    // Preparar documentos con archivos (ADJUNTO) - filtrar solo los que tienen archivo
    const documentosConArchivos = this.documentosPendientes
      .filter(doc => !doc.esRequisitoBool && doc.file)
      .map(doc => ({
        documentoPersonal: {
          idPersona: this.persona!.idPersona!,
          idTipoDocumentoPersonal: doc.idTipoDocumentoPersonal,
          codigoRequisito: (doc.requisito.idRequisitos || 0).toString(),
          estado: true,
          valorDato: true,
          observacion: doc.observacion,
          tieneArchivo: true
        },
        file: doc.file!
      }));

    // Preparar documentos sin archivos (BOOL) - de los documentos pendientes que son BOOL
    const documentosBool: any[] = this.documentosPendientes
      .filter(doc => doc.esRequisitoBool)
      .map(doc => ({
        documentoPersonal: {
          idPersona: this.persona!.idPersona!,
          idTipoDocumentoPersonal: doc.idTipoDocumentoPersonal,
          idAdjunto: null,
          codigoRequisito: (doc.requisito.idRequisitos || 0).toString(),
          estado: doc.valorBool ? true : false,
          valorDato: doc.valorBool || false,
          observacion: doc.observacion
        }
      }));

    // Combinar todos los documentos
    const todosLosDocumentos = [...documentosConArchivos, ...documentosBool];

    if (todosLosDocumentos.length === 0) {
      this.uploading = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay documentos para procesar'
      });
      return;
    }

    // Enviar documentos con archivos si existen
    if (documentosConArchivos.length > 0) {
      this.postulacionService.createDocumentosPersonalesConArchivos(documentosConArchivos).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Documentos con archivos subidos correctamente'
          });
          this.documentosPendientes = [];
          this.procesarDocumentosBool(documentosBool);
        },
        error: (err) => {
          console.error('Error subiendo documentos con archivos:', err);
          this.uploading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al subir los documentos con archivos'
          });
        }
      });
    } else {
      // Solo procesar documentos BOOL
      this.procesarDocumentosBool(documentosBool);
    }
  }

  private procesarDocumentosBool(documentosBool: any[]): void {
    if (documentosBool.length === 0) {
      this.finalizarConfirmacion();
      return;
    }

    // Enviar documentos BOOL uno por uno
    let completados = 0;
    const total = documentosBool.length;
    let errores = 0;

    documentosBool.forEach(doc => {
      this.postulacionService.createDocumentoPersonal(doc.documentoPersonal).subscribe({
        next: (response: any) => {
          completados++;
          if (completados + errores === total) {
            if (errores === 0) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Documentos booleanos procesados correctamente'
              });
            } else {
              this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: `${completados} documentos procesados, ${errores} errores`
              });
            }
            this.finalizarConfirmacion();
          }
        },
        error: (err: any) => {
          console.error('Error procesando documento booleano:', err);
          errores++;
          if (completados + errores === total) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error al procesar documentos booleanos: ${errores} errores`
            });
            this.uploading = false;
          }
        }
      });
    });
  }

  private finalizarConfirmacion(): void {
    this.uploading = false;
    // Recargar documentos personales y requisitos para sincronizar
    this.loadDocumentosPersonalesByPersona();
    this.loadRequisitos();
  }

  getDocumentoPendiente(requisito: RequisitoExtendido): DocumentoTemp | undefined {
    return this.documentosPendientes.find(doc => doc.requisito.idRequisitos === requisito.idRequisitos);
  }

  eliminarDocumentoPendiente(requisito: RequisitoExtendido): void {
    const index = this.documentosPendientes.findIndex(
      doc => doc.requisito.idRequisitos === requisito.idRequisitos
    );
    if (index >= 0) {
      const docToRemove = this.documentosPendientes[index];
      this.documentosPendientes.splice(index, 1);
      
      // Limpiar previsualización si era este documento
      if (docToRemove.file && this.previewFileName === docToRemove.file.name) {
        if (this.previewUrl) {
          URL.revokeObjectURL(this.previewUrl);
        }
        this.previewUrl = null;
        this.previewFileName = null;
      }
      
      this.messageService.add({
        severity: 'info',
        summary: 'Eliminado',
        detail: `Documento "${requisito.detalle}" eliminado de la lista`
      });
    }
  }

  // Métodos para aprobar/rechazar documentos individuales
  aceptarDocumento(requisito: RequisitoExtendido): void {
    if (!requisito.documentoExistente) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay documento para aprobar'
      });
      return;
    }

    const formData = new FormData();
    formData.append('IdDocumentosPersonales', requisito.documentoExistente.idDocumentosPersonales?.toString() || '0');
    formData.append('IdPersona', requisito.documentoExistente.idPersona?.toString() || '0');
    formData.append('IdTipoDocumentoPersonal', requisito.documentoExistente.idTipoDocumentoPersonal?.toString() || '0');
    formData.append('CodigoRequisito', requisito.documentoExistente.codigoRequisito || '');
    formData.append('Estado', 'true');
    formData.append('ValorDato', 'true');
    formData.append('Observacion', requisito.documentoExistente.observacion || 'Documento aprobado');

    this.postulacionService.updateDocumentoPersonal(formData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento aprobado correctamente'
        });
        this.loadDocumentosPersonalesByPersona();
      },
      error: (err) => {
        console.error('Error al aprobar documento:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo aprobar el documento'
        });
      }
    });
  }

  rechazarDocumento(requisito: RequisitoExtendido): void {
    if (!requisito.documentoExistente) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay documento para rechazar'
      });
      return;
    }

    const formData = new FormData();
    formData.append('IdDocumentosPersonales', requisito.documentoExistente.idDocumentosPersonales?.toString() || '0');
    formData.append('IdPersona', requisito.documentoExistente.idPersona?.toString() || '0');
    formData.append('IdTipoDocumentoPersonal', requisito.documentoExistente.idTipoDocumentoPersonal?.toString() || '0');
    formData.append('CodigoRequisito', requisito.documentoExistente.codigoRequisito || '');
    formData.append('Estado', 'false');
    formData.append('ValorDato', 'false');
    formData.append('Observacion', requisito.documentoExistente.observacion || 'Documento rechazado');

    this.postulacionService.updateDocumentoPersonal(formData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento rechazado'
        });
        this.loadDocumentosPersonalesByPersona();
      },
      error: (err) => {
        console.error('Error al rechazar documento:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo rechazar el documento'
        });
      }
    });
  }

  // Métodos para acciones de postulación
  aprobarPostulacion(): void {
    console.log(this.postulacionByDocumento)
    if (!this.postulacionByDocumento) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay postulación seleccionada'
      });
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no autenticado'
      });
      return;
    }

    this.postulacionService.cambiarEstadoPostulacion(
      this.postulacionByDocumento.idPostulacion!,
      EstadoPostulacion.APROBADO,
      'Postulación aprobada',
      currentUser.id
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Postulación aprobada correctamente'
        });
        // Navigate to payments page
        this.router.navigate(['/dashboard/pagos']);
      },
      error: (err) => {
        console.error('Error al aprobar postulación:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo aprobar la postulación'
        });
      }
    });
  }

  rechazarPostulacion(): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de que desea rechazar esta postulación? Esta acción no se puede deshacer.',
      header: 'Confirmar Rechazo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, rechazar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.ejecutarRechazoPostulacion();
      }
    });
  }

  private ejecutarRechazoPostulacion(): void {
    if (!this.postulacionByDocumento) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay postulación seleccionada'
      });
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no autenticado'
      });
      return;
    }

    this.postulacionService.cambiarEstadoPostulacion(
      this.postulacionByDocumento.idPostulacion!,
      EstadoPostulacion.RECHAZADO,
      'Postulación rechazada',
      currentUser.id
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Postulación rechazada correctamente'
        });
        setTimeout(() => {
          this.volver();
        }, 2000);
      },
      error: (err) => {
        console.error('Error al rechazar postulación:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo rechazar la postulación'
        });
      }
    });
  }

  esperaDocumentos(): void {
    if (!this.postulacion) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay postulación seleccionada'
      });
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no autenticado'
      });
      return;
    }

    this.postulacionService.cambiarEstadoPostulacion(
      this.postulacion.idPostulacion!,
      EstadoPostulacion.ESPERA_DOCUMENTOS,
      'Postulación en espera de documentos',
      currentUser.id
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Actualizado',
          detail: 'Postulación en espera de documentos'
        });
        setTimeout(() => {
          this.volver();
        }, 2000);
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado'
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

  // Métodos auxiliares para el template
  esTipoPrevisualizable(nombreArchivo: string | null, mimeType?: string | null): boolean {
    if (mimeType) {
      const tiposPreviewables = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'text/plain'];
      return tiposPreviewables.includes(mimeType);
    }
    if (!nombreArchivo) return false;
    const extension = nombreArchivo.toLowerCase().split('.').pop();
    const tiposPreviewables = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'];
    return tiposPreviewables.includes(extension || '');
  }

  obtenerTipoArchivo(nombreArchivo: string | null, mimeType?: string | null): string {
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
    if (!nombreArchivo) return 'Desconocido';
    const extension = nombreArchivo.toLowerCase().split('.').pop();
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
