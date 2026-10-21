import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-revert-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="revert-toast-notification" *ngIf="visible">
      <div class="revert-toast-content">
        <div class="revert-toast-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>
        <div class="revert-toast-text">
          <span class="revert-toast-title">{{ title }}</span>
          <span class="revert-toast-desc" [innerHTML]="message"></span>
        </div>
      </div>
      <div class="revert-toast-actions">
        <button type="button" class="btn-revert-action" (click)="onRevert()">
          <svg class="btn-revert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
          </svg>
          {{ revertLabel }} ({{ countdown }}s)
        </button>
      </div>
    </div>
  `,
  styles: [`
    .revert-toast-notification {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 1100;
      background: var(--surface-card, #ffffff);
      border: 1px solid var(--surface-border, #e0e0e0);
      border-left: 4px solid var(--brand-orange, #dc3545);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 1.5rem;
      max-width: 480px;
      animation: slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUpFade {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .revert-toast-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .revert-toast-icon {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      color: #dc3545;
      background: rgba(220, 53, 69, 0.1);
      padding: 0.4rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .revert-toast-icon svg {
      width: 100%;
      height: 100%;
    }

    .revert-toast-text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .revert-toast-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-color, #1e293b);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .revert-toast-desc {
      font-size: 0.825rem;
      color: var(--text-color-secondary, #64748b);
    }

    .revert-toast-actions {
      display: flex;
      align-items: center;
    }

    .btn-revert-action {
      background: var(--brand-yellow-dark, #E9B902);
      color: var(--brand-black, #1D1E1C);
      border: none;
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-revert-action:hover {
      background: var(--brand-yellow, #FCEA1E);
      transform: translateY(-1px);
    }

    .btn-revert-icon {
      width: 14px;
      height: 14px;
    }

    :host-context(.app-dark) .revert-toast-notification {
      background: #1e293b;
      border-color: #334155;
    }

    :host-context(.app-dark) .revert-toast-title {
      color: #f1f5f9;
    }

    :host-context(.app-dark) .revert-toast-desc {
      color: #94a3b8;
    }
  `]
})
export class SharedRevertToastComponent implements OnChanges, OnDestroy {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() title: string = 'ACCIÓN REGISTRADA';
  @Input() message: string = '';
  @Input() revertLabel: string = 'REVERTIR';
  @Input() timeoutSeconds: number = 10;

  @Output() revert = new EventEmitter<void>();
  @Output() timeout = new EventEmitter<void>();

  countdown = 10;
  private timer: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.countdown = this.timeoutSeconds;
      this.startTimer();
    }
    if (changes['visible'] && !this.visible) {
      this.clearTimer();
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startTimer(): void {
    this.clearTimer();
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.clearTimer();
        this.visible = false;
        this.visibleChange.emit(false);
        this.timeout.emit();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onRevert(): void {
    this.clearTimer();
    this.visible = false;
    this.visibleChange.emit(false);
    this.revert.emit();
  }
}
