import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges,
  SimpleChanges, ViewChild, ElementRef, inject, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { PostulacionService } from '../../../../../core/services/postulaciones/postulacion.service';
import { RequisitosService } from '../../../../../core/services/postulaciones/requisitos.service';
import { MatriculaDTO, RequisitosDTO } from '../../../../../data/models/Entities';
import { API_BASE_URL } from '../../../../../core/constants/app.constants';
import { DocumentoPreviewComponent } from '../../get-by-id/components/documento-preview/documento-preview.component';
import { SharedModalComponent } from '../../../../../shared/shared-modal/shared-modal.component';

export interface RequisitoMatriculaItem extends RequisitosDTO {
  completado?: boolean;
  documentoExistente?: any;
}

@Component({
  selector: 'app-view-student-documents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProgressSpinnerModule,
    ButtonModule,
    TooltipModule,
    DocumentoPreviewComponent,
    SharedModalComponent
  ],
  providers: [MessageService],
  templateUrl: './view-student-documents.component.html',
  styleUrls: ['./view-student-documents.component.css']
})
export class ViewStudentDocumentsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() matricula: MatriculaDTO | null = null;
  @Input() idPersona: number | null = null;
  @Input() idMalla: number | null = null;
  @Output() documentsChanged = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  requisitos: RequisitoMatriculaItem[] = [];
  documentosPersonales: any[] = [];
  loading = false;
  subiendo = new Set<number>();

  // Preview state
  previewUrl: string | null = null;
  previewFileName: string | null = null;
  previewFileType: string | null = null;
  selectedRequisitoId: number | null = null;

  // Selected for file upload
  selectedRequisitoParaSubida: RequisitoMatriculaItem | null = null;

  // Delete modal
  mostrarDialogEliminar = false;
  requisitoParaEliminar: RequisitoMatriculaItem | null = null;
  eliminando = false;

  private postulacionService = inject(PostulacionService);
  private requisitosService = inject(RequisitosService);
  private messageService = inject(MessageService);

  ngOnInit(): void {
    this.cargarDocumentos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matricula'] || changes['idPersona'] || changes['idMalla']) {
      this.cargarDocumentos();
    }
  }

  cargarDocumentos(): void {
    const personaId = this.idPersona || (this.matricula as any)?.idPersona || this.matricula?.idUsuarioAlumno;
    const mallaId = this.idMalla || this.matricula?.idMalla;

    if (!personaId || !mallaId) return;

    this.loading = true;

    this.requisitosService.getRequisitosByMalla(mallaId).subscribe({
      next: (reqs) => {
        this.requisitos = reqs || [];
        this.postulacionService.getDocumentosPersonalesByPersona(personaId).subscribe({
          next: (res: any) => {
            let docs = res?.data || res;
            if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
              this.documentosPersonales = Object.values(docs);
            } else {
              this.documentosPersonales = docs || [];
            }
            this.sincronizarRequisitos();
            this.loading = false;
          },
          error: () => {
            this.documentosPersonales = [];
            this.sincronizarRequisitos();
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error cargando requisitos:', err);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los requisitos del estudiante.'
        });
      }
    });
  }

  isBoolRequisito(r: RequisitoMatriculaItem): boolean {
    const tipo = (r.tipoDato || '').toUpperCase().trim();
    return tipo === 'BOOL' || tipo === 'BOOLEAN';
  }

  isBoolAprobado(r: RequisitoMatriculaItem): boolean {
    const doc = r.documentoExistente;
    if (!doc) return false;
    return doc.estado === true || doc.valorDato === true || doc.valorDato === 'true' || doc.valorDato === '1' || doc.valorDato === 1;
  }

  private sincronizarRequisitos(): void {
    this.requisitos.forEach(r => {
      const doc = this.documentosPersonales.find(
        d => d.codigoRequisito === r.idRequisitos?.toString()
      );
      r.completado = !!doc;
      r.documentoExistente = doc;
    });
  }

  getEstadoRequisito(r: RequisitoMatriculaItem): 'sin-documento' | 'subiendo' | 'subido' | 'aprobado' | 'rechazado' {
    const key = r.idRequisitos!;
    if (this.subiendo.has(key)) return 'subiendo';
    const doc = r.documentoExistente;
    if (!doc || (!doc.idAdjunto && r.tipoDato === 'ADJUNTO')) return 'sin-documento';
    if (doc.estado === true) return 'aprobado';
    if (doc.estado === false) return 'rechazado';
    return 'subido';
  }

  verDocumento(requisito: RequisitoMatriculaItem): void {
    this.selectedRequisitoId = requisito.idRequisitos ?? null;

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
      this.setPreview(fullUrl, fileName, fileType);
      return;
    }

    const idAdjunto = requisito.documentoExistente?.idAdjunto;
    if (!idAdjunto) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin adjunto',
        detail: 'Este requisito no tiene un archivo digital subido.'
      });
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
        this.setPreview(url, fileName, fileType);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el archivo adjunto.'
        });
      }
    });
  }

  private setPreview(url: string, fileName: string, fileType: string): void {
    if (this.previewUrl && this.previewUrl.startsWith('blob:') && this.previewUrl !== url) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = url;
    this.previewFileName = fileName;
    this.previewFileType = fileType;
  }

  iniciarSubida(requisito: RequisitoMatriculaItem): void {
    this.selectedRequisitoParaSubida = requisito;
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: any): Promise<void> {
    const file: File = event.target.files[0];
    const requisito = this.selectedRequisitoParaSubida;
    if (!file || !requisito) return;

    if (file.size > 15 * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Archivo demasiado grande',
        detail: 'El archivo supera el límite permitido de 15MB.'
      });
      this.selectedRequisitoParaSubida = null;
      return;
    }

    const key = requisito.idRequisitos!;
    this.selectedRequisitoParaSubida = null;
    this.fileInput.nativeElement.value = '';
    this.subiendo.add(key);

    const personaId = this.idPersona || (this.matricula as any)?.idPersona || this.matricula?.idUsuarioAlumno;
    if (!personaId) {
      this.subiendo.delete(key);
      return;
    }

    const docExistente = requisito.documentoExistente;
    const debeEliminarAnterior = docExistente?.idDocumentosPersonales && docExistente?.estado !== true;

    const doUpload = (uploadFile: File) => {
      this.postulacionService.createDocumentosPersonalesConArchivos([{
        documentoPersonal: {
          idPersona: personaId,
          idTipoDocumentoPersonal: 2,
          codigoRequisito: key.toString(),
          estado: null,
          valorDato: true,
          observacion: requisito.detalle ?? '',
          tieneArchivo: true
        },
        file: uploadFile
      }]).subscribe({
        next: () => {
          this.subiendo.delete(key);
          this.messageService.add({
            severity: 'success',
            summary: 'Documento subido',
            detail: `"${requisito.detalle}" se ha subido correctamente.`
          });
          this.cargarDocumentos();
          this.documentsChanged.emit();
        },
        error: () => {
          this.subiendo.delete(key);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo subir el archivo.'
          });
        }
      });
    };

    if (debeEliminarAnterior) {
      this.postulacionService.deleteDocumentoPersonal(docExistente.idDocumentosPersonales).subscribe({
        next: () => {
          const adjuntoId = docExistente?.idAdjunto;
          if (adjuntoId) {
            this.postulacionService.deleteAdjunto(adjuntoId).subscribe({
              next: () => doUpload(file),
              error: () => doUpload(file)
            });
          } else {
            doUpload(file);
          }
        },
        error: () => doUpload(file)
      });
    } else {
      doUpload(file);
    }
  }

  abrirDialogEliminar(requisito: RequisitoMatriculaItem): void {
    this.requisitoParaEliminar = requisito;
    this.mostrarDialogEliminar = true;
  }

  cancelarDialogEliminar(): void {
    this.mostrarDialogEliminar = false;
    this.requisitoParaEliminar = null;
  }

  confirmarEliminar(): void {
    const requisito = this.requisitoParaEliminar;
    if (!requisito?.documentoExistente?.idDocumentosPersonales) {
      this.mostrarDialogEliminar = false;
      return;
    }

    this.eliminando = true;
    this.postulacionService.deleteDocumentoPersonal(requisito.documentoExistente.idDocumentosPersonales).subscribe({
      next: () => {
        this.eliminando = false;
        this.mostrarDialogEliminar = false;
        this.requisitoParaEliminar = null;
        if (this.selectedRequisitoId === requisito.idRequisitos) {
          this.previewUrl = null;
          this.previewFileName = null;
          this.previewFileType = null;
          this.selectedRequisitoId = null;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Documento eliminado',
          detail: `Se eliminó el documento "${requisito.detalle}".`
        });
        this.cargarDocumentos();
        this.documentsChanged.emit();
      },
      error: () => {
        this.eliminando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el documento.'
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
}
