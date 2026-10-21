import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';

export interface ToastMessage {
  severity: 'success' | 'error' | 'warn' | 'info';
  summary: string;
  detail: string;
  life?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private messageService = inject(MessageService);
  private toastSubject = new Subject<ToastMessage>();
  toast$ = this.toastSubject.asObservable();

  showSuccess(detail: string, summary: string = 'Éxito'): void {
    this.toastSubject.next({ severity: 'success', summary, detail, life: 4000 });
    this.messageService.add({ severity: 'success', summary, detail, life: 4000 });
  }

  showError(detail: string, summary: string = 'Error'): void {
    this.toastSubject.next({ severity: 'error', summary, detail, life: 5000 });
    this.messageService.add({ severity: 'error', summary, detail, life: 5000 });
  }

  showInfo(detail: string, summary: string = 'Información'): void {
    this.toastSubject.next({ severity: 'info', summary, detail, life: 4000 });
    this.messageService.add({ severity: 'info', summary, detail, life: 4000 });
  }

  showWarning(detail: string, summary: string = 'Advertencia'): void {
    this.toastSubject.next({ severity: 'warn', summary, detail, life: 4000 });
    this.messageService.add({ severity: 'warn', summary, detail, life: 4000 });
  }
}
