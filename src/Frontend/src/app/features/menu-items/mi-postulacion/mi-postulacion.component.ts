import { Component, OnInit, ViewChild, ElementRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { PostulacionService, EstadoPostulacion } from '../../../core/services/postulaciones';
import { PaginatedPostulacionesResponse } from '../../../core/services/postulaciones/postulacion.service';
import { RequisitosService } from '../../../core/services/postulaciones/requisitos.service';
import { RequisitosDTO, PersonaDTO } from '../../../data/models/Entities';
import { AuthService } from '../../../core/auth/index';
import { MessageService } from 'primeng/api';
import { PersonaService } from '../../../core/services/postulaciones/persona.service';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';
import { ConfirmationModalComponent } from '../../../shared/modal-confirmation/confirmation-modal.component';

interface RequisitoExtendido extends RequisitosDTO {
  completado?: boolean;
  documentoExistente?: any;
}

/** Estados posibles para un requisito de tipo ADJUNTO */
type EstadoRequisito = 'sin-documento' | 'pendiente-local' | 'subido-pendiente' | 'aprobado' | 'rechazado';

/** Interfaz para CanDeactivate */
export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Pipe({ name: 'safe', standalone: true })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url: string, _type: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

@Component({
  selector: 'app-mi-postulacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SafePipe, SharedToastComponent, ConfirmationModalComponent],
  providers: [MessageService],
  templateUrl: './mi-postulacion.component.html',
  styleUrls: ['./mi-postulacion.component.css']
})
export class MiPostulacionComponent implements OnInit, OnDestroy, CanComponentDeactivate {

  documento: string | null = null;
  postulacion: PaginatedPostulacionesResponse | null = null;
  persona: PersonaDTO | null = null;
  requisitos: RequisitoExtendido[] = [];
  documentosPersonales: any[] = [];
  loading = true;

  /** Archivos seleccionados localmente antes de confirmar subida, indexados por idRequisitos */
  archivosLocales = new Map<number, { file: File; blobUrl?: string }>();
  /** Ids de requisitos cuya subida está en progreso */
  subiendo = new Set<number>();

  selectedRequisito: RequisitoExtendido | null = null;
  previewUrl: string | null = null;
  previewFileName: string | null = null;
  previewFileType: string | null = null;

  // ── Modal advertencia de salida ────────────────────────────────────────────
  mostrarModalSalida = false;
  guardandoCambios = false;
  /** Subject que resuelve la pregunta del guard */
  private deactivateSubject: Subject<boolean> | null = null;

  // ── Modal confirmación de eliminación de documento ─────────────────────────
  mostrarDialogEliminarDocumento = false;
  requisitoEliminar: RequisitoExtendido | null = null;
  eliminandoDocumento = false;
  mensajeEliminarDocumento = '';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private postulacionService = inject(PostulacionService);
  private requisitosService = inject(RequisitosService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private personaService = inject(PersonaService);

  // ── CanDeactivate ────────────────────────────────────────────────────────────
  canDeactivate(): Observable<boolean> | boolean {
    if (this.archivosLocales.size === 0) return true;

    // Hay archivos pendientes → mostrar modal y esperar respuesta
    this.mostrarModalSalida = true;
    this.deactivateSubject = new Subject<boolean>();
    return this.deactivateSubject.asObservable();
  }

  /** El usuario eligió SALIR sin guardar */
  onModalSalidaRechazar(): void {
    this.mostrarModalSalida = false;
    this.deactivateSubject?.next(true);
    this.deactivateSubject?.complete();
    this.deactivateSubject = null;
  }

  /** El usuario eligió GUARDAR y luego salir */
  async onModalSalidaAceptar(): Promise<void> {
    this.guardandoCambios = true;
    try {
      await this.guardarTodosLosPendientes();
      this.mostrarModalSalida = false;
      this.deactivateSubject?.next(true);
      this.deactivateSubject?.complete();
      this.deactivateSubject = null;
    } catch {
      // Si falló alguna subida, dejar al usuario en la página
      this.mostrarModalSalida = false;
      this.deactivateSubject?.next(false);
      this.deactivateSubject?.complete();
      this.deactivateSubject = null;
    } finally {
      this.guardandoCambios = false;
    }
  }

  /** El usuario cerró el modal (sin elegir) → quedarse en la página */
  onModalSalidaCerrar(): void {
    this.mostrarModalSalida = false;
    this.deactivateSubject?.next(false);
    this.deactivateSubject?.complete();
    this.deactivateSubject = null;
  }

  // ── Guardar todos los pendientes ─────────────────────────────────────────────
  private async guardarTodosLosPendientes(): Promise<void> {
    const requisitosConArchivo = this.requisitos.filter(r =>
      this.archivosLocales.has(r.idRequisitos!)
    );

    if (requisitosConArchivo.length === 0) return;

    const promesas = requisitosConArchivo.map(r => this.confirmarSubidaIndividual(r));
    await Promise.allSettled(promesas);
  }

  // ── Ciclo de vida ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.username) {
      this.documento = currentUser.username;
      this.loadPostulacionDetails();
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo obtener información del usuario' });
      this.loading = false;
    }
  }

  loadPostulacionDetails(): void {
    if (!this.documento) return;
    this.loading = true;
    this.postulacionService.getPostulacionByDocumento(this.documento).subscribe({
      next: (postulacion) => {
        this.postulacion = postulacion;
        this.loadDataPerson();
        this.loadRequisitos();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar tu postulación' });
        this.loading = false;
      }
    });
  }

  loadRequisitos(): void {
    const idMalla = this.postulacion?.items[0]?.malla?.idMalla;
    if (!idMalla) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo determinar la malla para cargar requisitos' });
      this.loading = false;
      return;
    }
    this.requisitosService.getRequisitosByMalla(idMalla).subscribe({
      next: (requisitos) => {
        this.requisitos = requisitos || [];
        if (this.documentosPersonales && this.documentosPersonales.length > 0) {
          this.sincronizarRequisitosConDocumentos();
        }
        this.loadDocumentosPersonalesByPersona();
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los requisitos' });
        this.loading = false;
      }
    });
  }

  loadDocumentosPersonalesByPersona(): void {
    const idPersona = this.persona?.idPersona ??
      (this.postulacion?.items?.[0]?.personasimple as any)?.idPersona ??
      this.postulacion?.items?.[0]?.idPersona;

    if (!idPersona) return;

    this.postulacionService.getDocumentosPersonalesByPersona(idPersona).subscribe({
      next: (documentos) => {
        const rawDocs = documentos?.data ?? documentos ?? [];
        this.documentosPersonales = Array.isArray(rawDocs)
          ? rawDocs
          : (rawDocs && typeof rawDocs === 'object' ? Object.values(rawDocs) : []);
        this.sincronizarRequisitosConDocumentos();
      },
      error: () => {
        this.documentosPersonales = [];
        this.sincronizarRequisitosConDocumentos();
      }
    });
  }

  private sincronizarRequisitosConDocumentos(): void {
    if (!this.requisitos || this.requisitos.length === 0) return;

    this.requisitos.forEach(requisito => {
      const reqIdStr = requisito.idRequisitos != null ? String(requisito.idRequisitos).trim() : '';
      const documentoExistente = this.documentosPersonales.find(
        doc => doc.codigoRequisito != null && String(doc.codigoRequisito).trim() === reqIdStr
      );
      requisito.completado = !!documentoExistente;
      requisito.documentoExistente = documentoExistente;
    });
  }

  loadDataPerson(): void {
    if (!this.documento) return;
    this.personaService.getPersonaByDocumento(this.documento).subscribe({
      next: (personas) => {
        if (personas?.length > 0) {
          this.persona = personas[0];
          this.loadDocumentosPersonalesByPersona();
        }
      }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }

  // ── Máquina de estados por requisito ────────────────────────────────────────
  getEstado(requisito: RequisitoExtendido): EstadoRequisito {
    const key = requisito.idRequisitos!;
    if (this.archivosLocales.has(key)) return 'pendiente-local';
    const doc = requisito.documentoExistente;
    if (!doc || doc.idAdjunto == null) return 'sin-documento';
    if (doc.estado === true)  return 'aprobado';
    if (doc.estado === false) return 'rechazado';
    return 'subido-pendiente';
  }

  // ── Subida individual ────────────────────────────────────────────────────────
  iniciarSubida(requisito: RequisitoExtendido): void {
    this.selectedRequisito = requisito;
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  /**
   * Al seleccionar un archivo → convierte de Word a PDF si es necesario,
   * solo guarda localmente y muestra preview.
   * NO sube hasta que el usuario confirme o guarde al salir.
   */
  async onFileSelected(event: any): Promise<void> {
    let file: File = event.target.files[0];
    if (!file || !this.selectedRequisito) return;

    if (file.size > 15 * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn', summary: 'Archivo demasiado grande',
        detail: 'El archivo supera el límite de 15MB. Sube un archivo más pequeño.', life: 5000
      });
      this.selectedRequisito = null;
      return;
    }

    const requisitoActual = this.selectedRequisito;
    const key = requisitoActual.idRequisitos!;

    const existing = this.archivosLocales.get(key);
    if (existing?.blobUrl) URL.revokeObjectURL(existing.blobUrl);

    // Guardar localmente
    const blobUrl = URL.createObjectURL(file);
    this.archivosLocales.set(key, { file, blobUrl });
    this.previewUrl = blobUrl;
    this.previewFileName = file.name;
    this.previewFileType = file.type;

    this.selectedRequisito = null;
    this.fileInput.nativeElement.value = '';

    this.messageService.add({
      severity: 'info', summary: 'Archivo listo',
      detail: `"${file.name}" seleccionado para "${requisitoActual.detalle}". Se guardará al salir o al presionar Confirmar.`,
      life: 5000
    });
  }

  quitarArchivoLocal(requisito: RequisitoExtendido): void {
    const key = requisito.idRequisitos!;
    const entry = this.archivosLocales.get(key);
    if (entry?.blobUrl) URL.revokeObjectURL(entry.blobUrl);
    if (this.previewFileName === entry?.file?.name) this.limpiarPreview();
    this.archivosLocales.delete(key);
  }

  async confirmarSubidaIndividual(requisito: RequisitoExtendido): Promise<void> {
    const key = requisito.idRequisitos!;
    const entry = this.archivosLocales.get(key);
    if (!entry || !this.persona?.idPersona) return;

    this.subiendo.add(key);

    const docExistente = requisito.documentoExistente;
    const debeEliminar = docExistente?.idDocumentosPersonales && docExistente?.estado !== true;

    const originalFile = entry.file;
    const fileToUpload = await this.convertImageToWebpIfNeeded(originalFile);

    const doUpload = (file: File, onFallback?: () => void) => {
      this.postulacionService.createDocumentosPersonalesConArchivos([{
        documentoPersonal: {
          idPersona: this.persona!.idPersona!,
          idTipoDocumentoPersonal: 2,
          codigoRequisito: (requisito.idRequisitos ?? 0).toString(),
          estado: null,
          valorDato: true,
          observacion: requisito.detalle ?? '',
          tieneArchivo: true
        },
        file
      }]).subscribe({
        next: (response: any) => {
          const sinCreacion = response?.data === 0 || (response?.message || '').toLowerCase().includes('no se crearon documentos');
          if (sinCreacion && onFallback) {
            onFallback();
            return;
          }
          this.subiendo.delete(key);
          this.archivosLocales.delete(key);
          if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl);
          this.messageService.add({ severity: 'success', summary: 'Subido', detail: `"${requisito.detalle}" subido correctamente.` });
          this.loadDocumentosPersonalesByPersona();
          this.transicionADocumentosRevision();
        },
        error: () => {
          this.subiendo.delete(key);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el documento. Inténtalo de nuevo.' });
        }
      });
    };

    const runUpload = () => {
      if (fileToUpload !== originalFile) {
        doUpload(fileToUpload, () => doUpload(originalFile));
      } else {
        doUpload(originalFile);
      }
    };

    if (debeEliminar) {
      this.postulacionService.deleteDocumentoPersonal(docExistente.idDocumentosPersonales).subscribe({
        next: () => {
          const adjuntoId = docExistente?.idAdjunto;
          if (adjuntoId) {
            this.postulacionService.deleteAdjunto(adjuntoId).subscribe({
              next: () => runUpload(),
              error: () => runUpload()
            });
          } else {
            runUpload();
          }
        },
        error: () => runUpload()
      });
    } else {
      runUpload();
    }
  }

  // ── Auto-transición al subir documentos ───────────────────────────────────

  private getPostulacionId(): number | null {
    return this.postulacion?.items?.[0]?.idPostulacion ?? null;
  }

  private getEstadoActual(): string {
    return (this.postulacion?.items?.[0]?.tipoestadoaprobacion?.detalle || '').toUpperCase().trim();
  }

  private esEstadoFinal(): boolean {
    const estado = this.getEstadoActual();
    return estado === 'APROBADO' || estado === 'RECHAZADO' || estado === 'FINALIZADO';
  }

  private getCurrentUserId(): number {
    return this.authService.getCurrentUser()?.id ?? 0;
  }

  /** Al subir un documento: si está en ESPERA_DOCUMENTOS → DOCUMENTOS_REVISION */
  private transicionADocumentosRevision(): void {
    const idPostulacion = this.getPostulacionId();
    const currentUserId = this.getCurrentUserId();
    if (!idPostulacion || !currentUserId) return;
    if (this.esEstadoFinal()) return;
    if (this.getEstadoActual() !== 'ESPERA DOCUMENTOS' && this.getEstadoActual() !== 'CONTACTO PERSONA') return;

    this.postulacionService.cambiarEstadoPostulacion(
      idPostulacion,
      EstadoPostulacion.DOCUMENTOS_REVISION,
      'Documentos subidos, pendientes de revisión',
      currentUserId
    ).subscribe({ error: () => {} });
  }

  // ── Previsualización ─────────────────────────────────────────────────────────
  visualizarLocal(requisito: RequisitoExtendido): void {
    const key = requisito.idRequisitos!;
    const entry = this.archivosLocales.get(key);
    if (!entry) return;
    if (!entry.blobUrl) {
      entry.blobUrl = URL.createObjectURL(entry.file);
      this.archivosLocales.set(key, entry);
    }
    this.limpiarPreview();
    this.previewUrl = entry.blobUrl;
    this.previewFileName = entry.file.name;
    this.previewFileType = entry.file.type;
  }

  verDocumento(requisito: RequisitoExtendido): void {
    if (requisito.completado && requisito.documentoExistente) {
      if (requisito.documentoExistente.idAdjunto) {
        if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
        this.postulacionService.getAdjunto(requisito.documentoExistente.idAdjunto).subscribe({
          next: (adjunto) => {
            this.previewUrl = URL.createObjectURL(adjunto.blob);
            const fileName = adjunto.fileName || requisito.documentoExistente.observacion || 'Documento';
            this.previewFileName = fileName;
            this.previewFileType = adjunto.contentType || adjunto.blob.type;
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el documento para previsualización' });
          }
        });
      } else {
        this.messageService.add({ severity: 'info', summary: 'Información', detail: 'No hay ID de adjunto disponible' });
      }
    } else {
      this.messageService.add({ severity: 'info', summary: 'Información', detail: 'No hay documento cargado para este requisito' });
    }
  }

  eliminarDocumentoCompletado(requisito: RequisitoExtendido): void {
    if (requisito.tipoDato === 'BOOL' && requisito.completado) {
      this.messageService.add({ severity: 'warn', summary: 'No permitido', detail: 'No puedes eliminar este dato porque ya fue subido y es de tipo booleano.' });
      return;
    }
    if (!requisito.documentoExistente?.idDocumentosPersonales) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el ID del documento para eliminar' });
      return;
    }

    this.requisitoEliminar = requisito;
    this.mensajeEliminarDocumento = `¿Estás seguro que deseas eliminar el documento <strong>"${requisito.detalle}"</strong>? Esta acción no se puede deshacer.`;
    this.mostrarDialogEliminarDocumento = true;
  }

  confirmarEliminarDocumento(): void {
    const requisito = this.requisitoEliminar;
    if (!requisito?.documentoExistente?.idDocumentosPersonales) {
      this.mostrarDialogEliminarDocumento = false;
      this.requisitoEliminar = null;
      return;
    }

    this.eliminandoDocumento = true;

    this.postulacionService.deleteDocumentoPersonal(requisito.documentoExistente.idDocumentosPersonales).subscribe({
      next: () => {
        requisito.completado = false;
        requisito.documentoExistente = undefined;
        if (this.previewUrl) { URL.revokeObjectURL(this.previewUrl); this.previewUrl = null; this.previewFileName = null; }
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: `Documento "${requisito.detalle}" eliminado correctamente` });

        this.mostrarDialogEliminarDocumento = false;
        this.requisitoEliminar = null;
        this.eliminandoDocumento = false;

        this.loadDocumentosPersonalesByPersona();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el documento.' });

        this.mostrarDialogEliminarDocumento = false;
        this.requisitoEliminar = null;
        this.eliminandoDocumento = false;
      }
    });
  }

  cancelarDialogEliminarDocumento(): void {
    this.mostrarDialogEliminarDocumento = false;
    this.requisitoEliminar = null;
  }

  private limpiarPreview(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
    this.previewFileName = null;
    this.previewFileType = null;
  }

  // ── Helpers de template ──────────────────────────────────────────────────────
  esSubiendo(requisito: RequisitoExtendido): boolean {
    return this.subiendo.has(requisito.idRequisitos!);
  }

  getArchivoLocal(requisito: RequisitoExtendido): { file: File; blobUrl?: string } | undefined {
    return this.archivosLocales.get(requisito.idRequisitos!);
  }

  calcularEdad(fechaNacimiento: string | undefined): string {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad + ' años';
  }

  esTipoPrevisualizable(fileName: string | null, mimeType?: string | null): boolean {
    if (!fileName) return false;
    const ext = fileName.toLowerCase().split('.').pop() ?? '';
    if (mimeType && ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'text/plain'].includes(mimeType)) return true;
    if ((!mimeType || mimeType === 'application/octet-stream') && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt'].includes(ext)) return true;
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt'].includes(ext);
  }

  esImagenArchivo(fileName: string | null, mimeType?: string | null): boolean {
    if (!fileName) return false;
    const ext = fileName.toLowerCase().split('.').pop() ?? '';
    if (mimeType?.startsWith('image/')) return true;
    if (!mimeType || mimeType === 'application/octet-stream') return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  }

  obtenerTipoArchivo(fileName: string | null, mimeType?: string | null): string {
    const mimeMap: Record<string, string> = {
      'application/pdf': 'Documento PDF', 'image/jpeg': 'Imagen JPEG', 'image/jpg': 'Imagen JPEG',
      'image/png': 'Imagen PNG', 'image/gif': 'Imagen GIF', 'text/plain': 'Archivo de texto', 'image/webp': 'Imagen WEBP'
    };
    if (mimeType && mimeType !== 'application/octet-stream' && mimeMap[mimeType]) return mimeMap[mimeType];
    if (!fileName) return 'Desconocido';
    const ext = fileName.toLowerCase().split('.').pop() ?? '';
    const extMap: Record<string, string> = {
      'pdf': 'Documento PDF', 'docx': 'Documento Word (DOCX)', 'doc': 'Documento Word (DOC)',
      'jpg': 'Imagen JPEG', 'jpeg': 'Imagen JPEG', 'png': 'Imagen PNG',
      'gif': 'Imagen GIF', 'webp': 'Imagen WEBP', 'txt': 'Archivo de texto', 'xlsx': 'Hoja de cálculo Excel'
    };
    return extMap[ext] ?? `Archivo .${ext.toUpperCase()}`;
  }

  private async convertImageToWebpIfNeeded(file: File): Promise<File> {
    const isConvertible = file.type.startsWith('image/') && !file.type.includes('webp') && !file.type.includes('gif');
    if (!isConvertible) return file;
    const blob = await this.toWebpBlob(file);
    if (!blob) return file;
    const newName = file.name.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    return new File([blob], newName, { type: 'image/webp', lastModified: Date.now() });
  }

  private toWebpBlob(file: File): Promise<Blob | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob); }, 'image/webp', 0.8);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  ngOnDestroy(): void {
    this.archivosLocales.forEach(entry => { if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl); });
    this.limpiarPreview();
  }

  getMensajeRechazo(requisito: RequisitoExtendido): string {
    const observacion = requisito.documentoExistente?.observacion;
    return observacion ? `Tu documento fue rechazado. Observación: ${observacion}` : 'Tu documento fue rechazado. Sube un nuevo documento que cumpla con los requisitos.';
  }

  get datosContacto(): any[] {
    if (this.postulacion?.items?.[0]?.personasimple?.pcontacto) {
      return this.postulacion.items[0].personasimple.pcontacto;
    }
    return [];
  }

  get tieneDatosContacto(): boolean {
    const pcontacto = this.postulacion?.items?.[0]?.personasimple?.pcontacto;
    if (!pcontacto) return false;
    if (Array.isArray(pcontacto)) return pcontacto.some(c => c && (c.tipocontacto?.detalle?.trim() || c.detalle?.trim()));
    return pcontacto.tipocontacto?.detalle?.trim() || pcontacto.detalle?.trim();
  }

  get contactoTexto(): string {
    const pcontacto = this.postulacion?.items[0]?.personasimple?.pcontacto;
    if (!pcontacto) return 'Sin información de contacto';
    if (Array.isArray(pcontacto)) {
      const contactosFormateados = pcontacto
        .filter(c => c && (c.tipocontacto?.detalle || c.detalle))
        .map(c => {
          const tipo = c.tipocontacto?.detalle?.trim();
          const detalle = c.detalle?.trim();
          if (tipo && detalle) return `${tipo}: ${detalle}`;
          if (tipo) return `${tipo}`;
          if (detalle) return `Detalle: ${detalle}`;
          return '';
        })
        .filter(Boolean)
        .join(' | ');
      return contactosFormateados || 'Sin información de contacto';
    }
    const tipo = pcontacto.tipocontacto?.detalle?.trim();
    const detalle = pcontacto.detalle?.trim();
    if (tipo && detalle) return `Tipo: ${tipo} | Detalle: ${detalle}`;
    if (tipo) return `Tipo: ${tipo}`;
    if (detalle) return `Detalle: ${detalle}`;
    return 'Sin información de contacto';
  }

  public getNombreEstudiante(): string {
    const p = this.postulacion?.items?.[0]?.personasimple;
    if (!p) return 'Estimado/a estudiante';
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
      .filter(name => name != null && name.trim() !== 'null' && name.trim() !== '')
      .join(' ');
  }
}