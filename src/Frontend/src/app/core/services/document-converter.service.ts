import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocumentConverterService {
  /**
   * Verifica si un archivo es un documento Word (.docx o .doc)
   */
  isWordDocument(file: File): boolean {
    if (!file) return false;
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return (
      name.endsWith('.docx') ||
      name.endsWith('.doc') ||
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      type === 'application/msword'
    );
  }

  /**
   * Retorna el archivo original directamente sin realizar conversiones.
   */
  async convertWordToPdfIfNeeded(file: File): Promise<File> {
    return file;
  }
}
