import { Component, OnInit, OnDestroy, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, ToastMessage } from '../toast.service';
import { MessageService } from 'primeng/api';

interface ToastItem extends ToastMessage {
  id: number;
  removing: boolean;
}

@Component({
  selector: 'app-shared-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts; track toast.id) {
        <div class="toast-item" [class.toast-removing]="toast.removing" [class]="'toast-' + toast.severity">
          <div class="toast-icon">
            @if (toast.severity === 'success') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            } @else if (toast.severity === 'error') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            } @else if (toast.severity === 'warn') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            }
          </div>
          <div class="toast-body">
            <div class="toast-summary">{{ toast.summary }}</div>
            <div class="toast-detail">{{ toast.detail }}</div>
          </div>
          <button class="toast-close" (click)="removeToast(toast.id)" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 1rem; right: 1rem; z-index: 9999;
      display: flex; flex-direction: column; gap: 0.5rem;
      max-width: 420px; width: 100%;
      pointer-events: none;
    }
    .toast-item {
      display: flex; align-items: flex-start; gap: 0.75rem;
      padding: 0.85rem 1rem;
      background: var(--surface-card, #ffffff);
      border: 1px solid var(--surface-border, #e0e0e0);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      animation: toast-in 0.3s ease-out;
      pointer-events: auto;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    .toast-item::before {
      content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 4px;
    }
    .toast-removing {
      animation: toast-out 0.3s ease-in forwards;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes toast-out {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100%); }
    }
    .toast-success::before { background: #22c55e; }
    .toast-success .toast-icon { color: #22c55e; }
    .toast-error::before { background: #ef4444; }
    .toast-error .toast-icon { color: #ef4444; }
    .toast-warn::before { background: #f59e0b; }
    .toast-warn .toast-icon { color: #f59e0b; }
    .toast-info::before { background: #3b82f6; }
    .toast-info .toast-icon { color: #3b82f6; }
    .toast-icon {
      flex-shrink: 0; width: 22px; height: 22px; margin-top: 0.1rem;
    }
    .toast-icon svg { width: 100%; height: 100%; }
    .toast-body { flex: 1; min-width: 0; }
    .toast-summary {
      font-size: 0.85rem; font-weight: 700; color: var(--text-color, #1e293b);
      margin-bottom: 0.15rem;
    }
    .toast-detail {
      font-size: 0.8rem; color: var(--text-color-secondary, #64748b);
      line-height: 1.4;
    }
    .toast-close {
      flex-shrink: 0; width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
      background: transparent; border: none; border-radius: 6px;
      cursor: pointer; color: var(--text-color-secondary, #94a3b8);
      transition: all 0.15s ease; padding: 0;
    }
    .toast-close:hover { background: var(--surface-hover, #f1f5f9); color: var(--text-color, #1e293b); }
    .toast-close svg { width: 14px; height: 14px; }
    :host-context(.app-dark) .toast-item { background: #1e293b; border-color: #334155; }
    :host-context(.app-dark) .toast-summary { color: #f1f5f9; }
    :host-context(.app-dark) .toast-detail { color: #94a3b8; }
  `]
})
export class SharedToastComponent implements OnInit, OnDestroy {
  toasts: ToastItem[] = [];
  private nextId = 0;
  private sub?: Subscription;
  private messageSub?: Subscription;

  constructor(
    private toastService: ToastService,
    @Optional() private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.sub = this.toastService.toast$.subscribe(msg => {
      this.addToast(msg);
    });

    if (this.messageService) {
      this.messageSub = this.messageService.messageObserver.subscribe(msg => {
        if (!msg) return;
        const messages = Array.isArray(msg) ? msg : [msg];
        messages.forEach(m => {
          const severity = (m.severity as any) || 'info';
          const summary = m.summary || '';
          const detail = m.detail || '';
          
          const isDuplicate = this.toasts.some(t => 
            t.severity === severity && 
            t.summary === summary && 
            t.detail === detail &&
            !t.removing
          );
          if (!isDuplicate) {
            this.addToast({
              severity,
              summary,
              detail,
              life: m.life
            });
          }
        });
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.messageSub?.unsubscribe();
  }

  private addToast(msg: ToastMessage): void {
    const id = this.nextId++;
    this.toasts.push({ ...msg, id, removing: false });
    const life = msg.life ?? 4000;
    setTimeout(() => this.removeToast(id), life);
  }

  removeToast(id: number): void {
    const idx = this.toasts.findIndex(t => t.id === id);
    if (idx === -1) return;
    this.toasts[idx].removing = true;
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 300);
  }
}
