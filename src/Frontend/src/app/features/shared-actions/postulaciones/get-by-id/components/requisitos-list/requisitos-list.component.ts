import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

import { PostulacionService } from '../../../../../../core/services/postulaciones';
import { RequisitosDTO, PersonaDTO } from '../../../../../../data/models/Entities';
import { API_BASE_URL } from '../../../../../../core/constants/app.constants';
import { AuthService } from '../../../../../../core/auth/index';
import { EmailService } from '../../../../../../core/services/postulaciones/email.service';
import { EmailTemplatesService, EmailTemplateData } from '../../../../../../shared/email-templates.service';
import { SharedModalComponent } from '../../../../../../shared/shared-modal/shared-modal.component';
import { SharedRevertToastComponent } from '../../../../../../shared/shared-revert-toast/shared-revert-toast.component';
import { ConfirmationModalComponent } from '../../../../../../shared/modal-confirmation/confirmation-modal.component';

export interface RequisitoExtendido extends RequisitosDTO {
  completado?: boolean;
  documentoExistente?: any;
}

type EstadoRequisito = 'sin-documento' | 'subiendo' | 'subido-pendiente' | 'aprobado' | 'rechazado';

@Component({
  selector: 'app-requisitos-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    SharedModalComponent,
    SharedRevertToastComponent,
    ConfirmationModalComponent
  ],
  templateUrl: './requisitos-list.component.html',
  styleUrls: ['./requisitos-list.component.css']
})
export class RequisitosListComponent {
  @Input() requisitos: RequisitoExtendido[] = [];
  @Input() persona: PersonaDTO | null = null;
  @Input() postulante: any; // Se usa para datos de email (nombre, cedula, malla, ciclo)

  @Output() viewDocument = new EventEmitter<{ url: string, fileName: string, fileType: string }>();
  @Output() requirementsChanged = new EventEmitter<{ type: 'upload' | 'approve' | 'reject' | 'delete' | 'bool' }>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  mostrarDialogRechazo = false;
  motivoRechazo = '';
  requisitoRechazo: RequisitoExtendido | null = null;

  mostrarDialogAprobarDocumento = false;
  requisitoAprobacion: RequisitoExtendido | null = null;

  mostrarDialogEliminarDocumento = false;
  requisitoEliminar: RequisitoExtendido | null = null;
  eliminandoDocumento = false;
  mensajeEliminarDocumento = '';

  revertVisible = false;
  revertTitle = '';
  revertMessage = '';
  revertData: {
    idDocumentosPersonales: number;
    idPersona: number;
    idTipoDocumentoPersonal: number;
    codigoRequisito: string;
    estadoAnterior: boolean | null;
    valorDatoAnterior: boolean;
    observacionAnterior: string;
    requisito: RequisitoExtendido;
  } | null = null;

  subiendo = new Set<number>();
  private requisitosVistos = new Set<number>();

  private postulacionService = inject(PostulacionService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private emailService = inject(EmailService);
  private emailTemplatesService = inject(EmailTemplatesService);

  getEstado(requisito: RequisitoExtendido): EstadoRequisito {
    const key = requisito.idRequisitos!;
    if (this.subiendo.has(key)) return 'subiendo';
    const doc = requisito.documentoExistente;
    if (!doc || doc.idAdjunto == null) return 'sin-documento';
    if (doc.estado === true) return 'aprobado';
    if (doc.estado === false) return 'rechazado';
    return 'subido-pendiente';
  }

  esSubiendo(requisito: RequisitoExtendido): boolean {
    return this.subiendo.has(requisito.idRequisitos!);
  }

  documentoFueVisto(requisito: RequisitoExtendido): boolean {
    return this.requisitosVistos.has(requisito.idRequisitos ?? -1);
  }

  iniciarSubida(requisito: RequisitoExtendido): void {
    this.requisitoRechazo = null;
    this.requisitoAprobacion = null;
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
    // Guardar temporalmente el requisito seleccionado para la subida
    (this as any).selectedRequisito = requisito;
  }

  async onFileSelected(event: any): Promise<void> {
    let file: File = event.target.files[0];
    const selectedRequisito = (this as any).selectedRequisito as RequisitoExtendido;
    if (!file || !selectedRequisito) return;

    if (file.size > 15 * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Archivo demasiado grande',
        detail: 'El archivo supera el límite de 15MB.',
        life: 5000
      });
      (this as any).selectedRequisito = null;
      return;
    }

    const requisito = selectedRequisito;
    const key = requisito.idRequisitos!;
    (this as any).selectedRequisito = null;
    this.fileInput.nativeElement.value = '';

    this.subiendo.add(key);

    const docExistente = requisito.documentoExistente;
    const debeEliminar = docExistente?.idDocumentosPersonales && docExistente?.estado !== true;

    const originalFile = file;

    const doUpload = (uploadFile: File) => {
      this.postulacionService.createDocumentosPersonalesConArchivos([{
        documentoPersonal: {
          idPersona: this.persona!.idPersona!,
          idTipoDocumentoPersonal: 2,
          codigoRequisito: (key).toString(),
          estado: null,
          valorDato: true,
          observacion: requisito.detalle ?? '',
          tieneArchivo: true
        },
        file: uploadFile
      }]).subscribe({
        next: () => {
          this.subiendo.delete(key);
          this.messageService.add({ severity: 'success', summary: 'Subido', detail: `"${requisito.detalle}" subido correctamente.` });
          this.requirementsChanged.emit({ type: 'upload' });
        },
        error: () => {
          this.subiendo.delete(key);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el documento.' });
        }
      });
    };

    const runUpload = () => {
      doUpload(file);
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

  verDocumento(requisito: RequisitoExtendido): void {
    const path = requisito.documentoExistente?.path;
    if (path) {
      const fileName = requisito.documentoExistente?.observacion || requisito.detalle || 'Documento';
      const extension = path.toLowerCase().split('.').pop() || '';
      let fileType = 'application/pdf';
      if (['jpg', 'jpeg'].includes(extension)) fileType = 'image/jpeg';
      else if (extension === 'png') fileType = 'image/png';
      else if (extension === 'webp') fileType = 'image/webp';
      else if (extension === 'gif') fileType = 'image/gif';

      const fullUrl = path.startsWith('http') ? path : `${API_BASE_URL}/${path}`;

      if (requisito.idRequisitos != null) {
        this.requisitosVistos.add(requisito.idRequisitos);
      }
      this.viewDocument.emit({ url: fullUrl, fileName, fileType });
      return;
    }

    const idAdjunto = requisito.documentoExistente?.idAdjunto;
    if (!idAdjunto) {
      this.messageService.add({ severity: 'info', summary: 'Información', detail: 'El documento no tiene archivo adjunto.' });
      return;
    }
    this.postulacionService.getAdjunto(idAdjunto).subscribe({
      next: (adjunto) => {
        const fileName = adjunto.fileName || requisito.documentoExistente?.observacion || requisito.detalle || 'Documento';
        let fileType = adjunto.contentType || adjunto.blob.type;

        if ((!fileType || fileType === 'application/octet-stream' || fileType === 'binary/octet-stream') && fileName) {
          const ext = fileName.toLowerCase().split('.').pop();
          if (ext === 'pdf') fileType = 'application/pdf';
          else if (['jpg', 'jpeg'].includes(ext || '')) fileType = 'image/jpeg';
          else if (ext === 'png') fileType = 'image/png';
          else if (ext === 'webp') fileType = 'image/webp';
        }

        let finalBlob = adjunto.blob;
        if (fileType && finalBlob.type !== fileType) {
          finalBlob = new Blob([adjunto.blob], { type: fileType });
        }

        const url = URL.createObjectURL(finalBlob);

        if (requisito.idRequisitos != null) {
          this.requisitosVistos.add(requisito.idRequisitos);
        }
        this.viewDocument.emit({ url, fileName, fileType });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el documento.' })
    });
  }

  aceptarDocumento(requisito: RequisitoExtendido): void {
    if (!requisito.documentoExistente) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay documento para aprobar' });
      return;
    }
    this.requisitoAprobacion = requisito;
    this.mostrarDialogAprobarDocumento = true;
  }

  confirmarAprobarDocumento(): void {
    const requisito = this.requisitoAprobacion;
    if (!requisito?.documentoExistente) {
      this.mostrarDialogAprobarDocumento = false;
      return;
    }

    const doc = requisito.documentoExistente;
    this.revertData = {
      idDocumentosPersonales: doc.idDocumentosPersonales,
      idPersona: doc.idPersona,
      idTipoDocumentoPersonal: doc.idTipoDocumentoPersonal,
      codigoRequisito: doc.codigoRequisito,
      estadoAnterior: doc.estado,
      valorDatoAnterior: doc.valorDato,
      observacionAnterior: doc.observacion,
      requisito: requisito
    };

    const currentUser = this.authService.getCurrentUser();
    const nombreUsuario = currentUser ? currentUser.username : 'Usuario';
    const fechaAprobacion = new Date().toLocaleDateString();
    const mensajeAprobacion = `Documento aprobado por ${nombreUsuario} el ${fechaAprobacion}`;

    const formData = new FormData();
    formData.append('IdDocumentosPersonales', doc.idDocumentosPersonales?.toString() || '0');
    formData.append('IdPersona', doc.idPersona?.toString() || '0');
    formData.append('IdTipoDocumentoPersonal', doc.idTipoDocumentoPersonal?.toString() || '0');
    formData.append('CodigoRequisito', doc.codigoRequisito || '');
    formData.append('Estado', 'true');
    formData.append('ValorDato', 'true');
    formData.append('Observacion', mensajeAprobacion);

    this.postulacionService.updateDocumentoPersonal(formData).subscribe({
      next: () => {
        doc.estado = true;
        doc.valorDato = true;
        doc.observacion = mensajeAprobacion;

        this.revertTitle = 'DOCUMENTO APROBADO';
        this.revertMessage = `Se ha aprobado el requisito <strong>${requisito.detalle}</strong>.`;
        this.revertVisible = true;

        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Documento aprobado correctamente' });
        this.mostrarDialogAprobarDocumento = false;
        this.requisitoAprobacion = null;
        this.requirementsChanged.emit({ type: 'approve' });
      },
      error: (err) => {
        console.error('Error al aprobar documento:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo aprobar el documento' });
        this.mostrarDialogAprobarDocumento = false;
        this.requisitoAprobacion = null;
      }
    });
  }

  cancelarDialogAprobarDocumento(): void {
    this.mostrarDialogAprobarDocumento = false;
    this.requisitoAprobacion = null;
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
    this.requisitoRechazo = requisito;
    this.motivoRechazo = '';
    this.mostrarDialogRechazo = true;
  }

  confirmarRechazoDocumento(): void {
    if (!this.requisitoRechazo || !this.requisitoRechazo.documentoExistente) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay documento para rechazar'
      });
      this.mostrarDialogRechazo = false;
      return;
    }

    const requisito = this.requisitoRechazo;
    const doc = requisito.documentoExistente;
    this.revertData = {
      idDocumentosPersonales: doc.idDocumentosPersonales,
      idPersona: doc.idPersona,
      idTipoDocumentoPersonal: doc.idTipoDocumentoPersonal,
      codigoRequisito: doc.codigoRequisito,
      estadoAnterior: doc.estado,
      valorDatoAnterior: doc.valorDato,
      observacionAnterior: doc.observacion,
      requisito: requisito
    };

    const motivo = this.motivoRechazo || 'Documento rechazado';

    const formData = new FormData();
    formData.append('IdDocumentosPersonales', doc.idDocumentosPersonales?.toString() || '0');
    formData.append('IdPersona', doc.idPersona?.toString() || '0');
    formData.append('IdTipoDocumentoPersonal', doc.idTipoDocumentoPersonal?.toString() || '0');
    formData.append('CodigoRequisito', doc.codigoRequisito || '');
    formData.append('Estado', 'false');
    formData.append('ValorDato', 'false');
    formData.append('Observacion', motivo);

    this.postulacionService.updateDocumentoPersonal(formData).subscribe({
      next: () => {
        doc.estado = false;
        doc.valorDato = false;
        doc.observacion = motivo;

        this.revertTitle = 'DOCUMENTO RECHAZADO';
        this.revertMessage = `Se ha rechazado el requisito <strong>${requisito.detalle}</strong>.`;
        this.revertVisible = true;

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento rechazado'
        });
        this.mostrarDialogRechazo = false;

        const emailDest = this.getEmailDestinatario();
        if (emailDest) {
          const nombre = this.getNombreEstudiante();
          const nombreDoc = requisito.detalle || 'documento';
          const emailData: EmailTemplateData = { nombreEstudiante: nombre, nombreDocumento: nombreDoc, motivoRechazo: motivo };
          const template = this.emailTemplatesService.getDocumentoRechazadoTemplate(emailData);
          this.enviarEmailSilencioso(emailDest, template.subject, template.body);
        }
        this.requisitoRechazo = null;
        this.motivoRechazo = '';
        this.requirementsChanged.emit({ type: 'reject' });
      },
      error: (err) => {
        console.error('Error al rechazar documento:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo rechazar el documento'
        });
        this.mostrarDialogRechazo = false;
        this.requisitoRechazo = null;
        this.motivoRechazo = '';
      }
    });
  }

  cancelarDialogRechazo(): void {
    this.mostrarDialogRechazo = false;
    this.requisitoRechazo = null;
    this.motivoRechazo = '';
  }

  ejecutarRevert(): void {
    if (!this.revertData) return;

    const data = this.revertData;
    this.revertVisible = false;

    const formData = new FormData();
    formData.append('IdDocumentosPersonales', data.idDocumentosPersonales?.toString() || '0');
    formData.append('IdPersona', data.idPersona?.toString() || '0');
    formData.append('IdTipoDocumentoPersonal', data.idTipoDocumentoPersonal?.toString() || '0');
    formData.append('CodigoRequisito', data.codigoRequisito || '');
    formData.append('Estado', data.estadoAnterior !== null ? data.estadoAnterior.toString() : '');
    formData.append('ValorDato', data.valorDatoAnterior.toString());
    formData.append('Observacion', data.observacionAnterior || 'Revertido por el usuario');

    this.postulacionService.updateDocumentoPersonal(formData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Acción Revertida', detail: 'Se ha restaurado el estado anterior del documento.' });
        this.revertData = null;
        this.requirementsChanged.emit({ type: 'delete' });
      },
      error: (err) => {
        console.error('Error al revertir documento:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo revertir la acción' });
      }
    });
  }

  marcarRequisitoCumple(requisito: RequisitoExtendido, cumple: boolean): void {
    const key = requisito.idRequisitos!;
    const idPersona = this.persona?.idPersona;
    if (!idPersona) return;
    this.subiendo.add(key);

    const docExistente = requisito.documentoExistente;

    const doCreate = () => {
      this.postulacionService.createDocumentoPersonal({
        idPersona: idPersona,
        idTipoDocumentoPersonal: 1,
        idAdjunto: 0,
        codigoRequisito: key.toString(),
        estado: cumple ? true : false,
        valorDato: cumple,
        observacion: cumple ? 'Cumple con el requisito' : 'No cumple – encargado se comunicará'
      }).subscribe({
        next: () => {
          this.subiendo.delete(key);
          this.messageService.add({
            severity: cumple ? 'success' : 'info',
            summary: 'Guardado',
            detail: `"${requisito.detalle}" marcado como ${cumple ? 'Cumple' : 'No Cumple'}.`
          });
          this.requirementsChanged.emit({ type: 'bool' });
        },
        error: () => {
          this.subiendo.delete(key);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la selección.' });
        }
      });
    };

    if (docExistente?.idDocumentosPersonales) {
      const formData = new FormData();
      formData.append('IdDocumentosPersonales', docExistente.idDocumentosPersonales.toString());
      formData.append('IdPersona', idPersona.toString());
      formData.append('IdTipoDocumentoPersonal', (docExistente.idTipoDocumentoPersonal || 1).toString());
      formData.append('CodigoRequisito', key.toString());
      formData.append('Estado', cumple ? 'true' : 'false');
      formData.append('ValorDato', cumple ? 'true' : 'false');
      formData.append('Observacion', cumple ? 'Cumple con el requisito' : 'No cumple – encargado se comunicará');

      this.postulacionService.updateDocumentoPersonal(formData).subscribe({
        next: () => {
          this.subiendo.delete(key);
          docExistente.estado = cumple;
          docExistente.valorDato = cumple;
          docExistente.observacion = cumple ? 'Cumple con el requisito' : 'No cumple – encargado se comunicará';
          this.messageService.add({
            severity: cumple ? 'success' : 'info',
            summary: 'Actualizado',
            detail: `"${requisito.detalle}" actualizado a ${cumple ? 'Cumple' : 'No Cumple'}.`
          });
          this.requirementsChanged.emit({ type: 'bool' });
        },
        error: () => {
          this.subiendo.delete(key);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la selección.' });
        }
      });
    } else {
      doCreate();
    }
  }

  eliminarDocumentoCompletado(requisito: RequisitoExtendido): void {
    if (!requisito.documentoExistente?.idDocumentosPersonales) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el ID del documento para eliminar'
      });
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

        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: `Documento "${requisito.detalle}" eliminado correctamente`
        });

        this.mostrarDialogEliminarDocumento = false;
        this.requisitoEliminar = null;
        this.eliminandoDocumento = false;

        this.requirementsChanged.emit({ type: 'delete' });
      },
      error: (err) => {
        console.error('Error eliminando documento:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el documento del servidor'
        });
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

  private getEmailDestinatario(): string | null {
    const pcontacto = this.postulante?.personasimple?.pcontacto;
    if (!pcontacto) return null;
    if (Array.isArray(pcontacto)) {
      const emailContact = pcontacto.find((c: any) =>
        c &&
        c.tipocontacto?.detalle?.toUpperCase().includes('CORREO') &&
        c.detalle?.trim()
      );
      return emailContact?.detalle?.trim() ?? null;
    }
    return pcontacto.detalle?.includes('@') ? pcontacto.detalle : null;
  }

  private getNombreEstudiante(): string {
    const p = this.postulante?.personasimple;
    if (!p) return 'Estimado/a estudiante';
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
      .filter(name => name != null && name.trim() !== 'null' && name.trim() !== '')
      .join(' ');
  }

  private enviarEmailSilencioso(destinatario: string, asunto: string, cuerpo: string): void {
    this.emailService.sendEmail({ destinatario, asunto, cuerpo, esHtml: true }).subscribe({
      error: (err) => console.warn('No se pudo enviar el correo de notificación:', err)
    });
  }

  private async convertImageToWebpIfNeeded(file: File): Promise<File> {
    const isConvertible = file.type.startsWith('image/') &&
      !file.type.includes('webp') &&
      !file.type.includes('gif');

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
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve(blob);
          },
          'image/webp',
          0.8
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  }
}
