import { Injectable } from '@angular/core';
import { TipoDatoContactoDTO } from '../../../data/models/Entities';

export interface PostulacionDraft {
  tipoOfertaOrigen: 'acelerado-virtual' | 'formal-virtual';
  formValues: Record<string, any>;
  selectedProvincia: any;
  contactosOpcionalesAgregados: TipoDatoContactoDTO[];
}

@Injectable({ providedIn: 'root' })
export class PostulacionDraftService {
  private draft: PostulacionDraft | null = null;

  save(draft: PostulacionDraft): void {
    this.draft = draft;
  }

  load(): PostulacionDraft | null {
    const d = this.draft;
    this.draft = null;
    return d;
  }

  has(): boolean {
    return this.draft !== null;
  }
}
