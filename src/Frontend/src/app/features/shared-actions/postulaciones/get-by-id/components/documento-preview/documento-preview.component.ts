import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SharedImagePreviewComponent } from '../../../../../../shared/shared-image-preview/shared-image-preview.component';

@Pipe({ name: 'safe', standalone: true })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }
  transform(url: string, type: string = 'resourceUrl'): SafeResourceUrl {
    if (!url) return '';
    switch (type) {
      case 'html': return this.sanitizer.bypassSecurityTrustHtml(url);
      case 'style': return this.sanitizer.bypassSecurityTrustStyle(url);
      case 'script': return this.sanitizer.bypassSecurityTrustScript(url);
      case 'url': return this.sanitizer.bypassSecurityTrustUrl(url);
      case 'resourceUrl': return this.sanitizer.bypassSecurityTrustResourceUrl(url);
      default: return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }
}

@Component({
  selector: 'app-documento-preview',
  standalone: true,
  imports: [CommonModule, SafePipe, SharedImagePreviewComponent],
  templateUrl: './documento-preview.component.html',
  styleUrls: ['./documento-preview.component.css']
})
export class DocumentoPreviewComponent {
  @Input() previewUrl: string | null = null;
  @Input() previewFileName: string | null = null;
  @Input() previewFileType: string | null = null;

  esTipoPrevisualizable(nombreArchivo: string | null, mimeType?: string | null): boolean {
    if (mimeType && mimeType !== 'application/octet-stream' && mimeType !== 'binary/octet-stream') {
      const tiposPreviewables = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'text/plain'];
      if (tiposPreviewables.includes(mimeType)) return true;
    }
    if (!nombreArchivo) return false;
    const extension = nombreArchivo.toLowerCase().split('.').pop();
    const tiposPreviewables = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt'];
    return tiposPreviewables.includes(extension || '');
  }

  esImagenArchivo(nombreArchivo: string | null, mimeType?: string | null): boolean {
    if (!nombreArchivo) return false;
    const extension = nombreArchivo.toLowerCase().split('.').pop() || '';
    if (mimeType?.startsWith('image/')) return true;
    if (!mimeType || mimeType === 'application/octet-stream') {
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
    }
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  }

  obtenerTipoArchivo(nombreArchivo: string | null, mimeType?: string | null): string {
    if (mimeType && mimeType !== 'application/octet-stream') {
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
        case 'image/webp':
          return 'Imagen WEBP';
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
      case 'webp':
        return 'Imagen WEBP';
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
}
