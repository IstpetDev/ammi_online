import { Component, Input, Output, EventEmitter, ElementRef, Renderer2, OnChanges, OnDestroy, AfterViewInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (_shouldRender) {
      <div class="mdl-fixed">
        <div (click)="onBackdropClick()" class="mdl-backdrop" [class.mdl-backdrop-visible]="_isOpen" [class.mdl-backdrop-hidden]="!_isOpen"></div>

        <div (click)="$event.stopPropagation()" [class]="panelClasses" [class.mdl-overflow-visible]="overflowVisible" [style.width]="customWidth || null">
          @if (title || showCloseButton) {
            <div class="mdl-header">
              <h3 class="mdl-title">
                <span class="mdl-title-text">{{ title }}</span>
              </h3>
              @if (showCloseButton) {
                <button (click)="onCancel()" class="mdl-close-btn" [attr.aria-label]="'Cerrar'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mdl-close-icon">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              }
            </div>
          }

          <div [class]="contentClasses">
            <ng-content></ng-content>
          </div>

          @if (showFooter) {
            <div class="mdl-footer">
              <ng-content select="[modal-footer]"></ng-content>
              @if (cancelText) {
                <button (click)="onCancel()" type="button" class="btn {{ cancelClass }}">
                  @if (cancelIcon) {
                    <i [class]="cancelIcon" style="margin-right: 0.25rem;"></i>
                  }
                  {{ cancelText }}
                </button>
              }
              @if (confirmText) {
                <button (click)="onConfirm()" type="button" class="btn {{ confirmClass }}" [disabled]="confirmDisabled || confirmLoading">
                  @if (confirmLoading) {
                    <svg class="mdl-btn-spinner" viewBox="0 0 24 24" fill="none" style="margin-right: 0.25rem;">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4" />
                    </svg>
                  } @else if (confirmIcon) {
                    <i [class]="confirmIcon" style="margin-right: 0.25rem;"></i>
                  }
                  {{ confirmText }}
                </button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .mdl-fixed {
      position: fixed;
      inset: 0;
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Poppins', sans-serif;
    }
    .mdl-backdrop {
      position: absolute;
      inset: 0;
      z-index: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      transition: all 0.3s ease-out;
    }
    .mdl-backdrop-visible { opacity: 1; }
    .mdl-backdrop-hidden { opacity: 0; }

    /* Modal panel */
    .mdl-panel {
      position: relative;
      z-index: 1;
      background: var(--surface-card);
      border-radius: 16px;
      border: 1px solid var(--surface-border);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .mdl-hidden { opacity: 0; transform: scale(0.95); }
    .mdl-visible { opacity: 1; transform: scale(1); }

    /* Overflow visible class */
    .mdl-panel.mdl-overflow-visible {
      overflow: visible !important;
    }
    .mdl-panel.mdl-overflow-visible .mdl-content {
      overflow: visible !important;
    }

    /* Header */
    .mdl-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
      flex-shrink: 0;
    }
    .mdl-title { margin: 0; display: flex; align-items: center; font-size: 1.1rem; }
    .mdl-title-text {
      font-weight: 700;
      color: var(--text-color);
      border-left: 4px solid var(--brand-yellow-dark);
      padding-left: 0.75rem;
    }
    .mdl-close-btn {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      color: var(--text-color-secondary);
      transition: all 0.2s ease;
    }
    .mdl-close-btn:hover { color: var(--text-color); background: var(--surface-hover); }
    .mdl-close-icon { width: 18px; height: 18px; }

    /* Content */
    .mdl-content {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      padding: 1.5rem;
      color: var(--text-color);
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .mdl-content-nopad { padding: 0; }

    /* Footer */
    .mdl-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--surface-border);
      flex-shrink: 0;
    }

    /* Buttons inside modal footer - support hover transitions and typography */
    .mdl-footer .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.6rem 1.25rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s ease;
      min-width: 100px;
      height: auto;
      border: 2px solid transparent;
    }

    /* Default Confirm */
    .btn-primary {
      background: var(--brand-yellow-dark);
      border: 2px solid var(--brand-yellow-dark);
      color: var(--brand-black);
    }
    .btn-primary:hover {
      background: var(--brand-yellow);
      border-color: var(--brand-yellow);
      transform: translateY(-1px);
    }
    .btn-primary:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
    }

    /* Default Cancel / Secondary */
    .btn-secondary {
      background: transparent;
      border: 2px solid var(--surface-border) !important;
      color: var(--text-color-secondary) !important;
    }
    .btn-secondary:hover {
      border-color: var(--text-color-secondary) !important;
      color: var(--text-color) !important;
      background: var(--surface-hover) !important;
    }

    /* Danger Button Style */
    .btn-danger {
      background-color: var(--error-color, #dc3545) !important;
      border: 2px solid var(--error-color, #dc3545) !important;
      color: white !important;
    }
    .btn-danger:hover {
      background-color: #bd2130 !important;
      border-color: #bd2130 !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
    }

    .mdl-btn-spinner {
      width: 16px;
      height: 16px;
      animation: mdl-spin 1s linear infinite;
    }
    @keyframes mdl-spin { to { transform: rotate(360deg); } }

    /* Custom sizing */
    .w-sm { width: 400px; max-width: 90vw; }
    .w-md { width: 500px; max-width: 90vw; }
    .w-lg { width: 700px; max-width: 90vw; }
    .w-xl { width: 900px; max-width: 95vw; }
    .w-full { width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }

    :host-context(.app-dark) .mdl-panel { background: var(--surface-card); }
    :host-context(.app-dark) .mdl-backdrop { background: rgba(0, 0, 0, 0.75); }
  `]
})
export class SharedModalComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() visible: boolean = false;
  @Input() title: string = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() customWidth: string = '';
  @Input() showCloseButton: boolean = true;
  @Input() closeOnOverlayClick: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() cancelText: string = '';
  @Input() confirmText: string = '';
  @Input() cancelIcon: string = '';
  @Input() confirmIcon: string = '';
  @Input() confirmDisabled: boolean = false;
  @Input() confirmLoading: boolean = false;
  @Input() confirmClass: string = 'btn-primary';
  @Input() cancelClass: string = 'btn-secondary';
  @Input() noContentPadding: boolean = false;
  @Input() overflowVisible: boolean = true;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();


  _shouldRender = false;
  _isOpen = false;
  private originalParent: HTMLElement | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit(): void {
    if (!this.originalParent && this.el.nativeElement.parentNode && this.el.nativeElement.parentNode !== document.body) {
      this.originalParent = this.el.nativeElement.parentNode;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      if (this.visible) {
        if (!this.originalParent && this.el.nativeElement.parentNode) {
          this.originalParent = this.el.nativeElement.parentNode;
        }
        this.renderer.appendChild(document.body, this.el.nativeElement);
        this._shouldRender = true;
        setTimeout(() => { this._isOpen = true; }, 20);
      } else {
        this._isOpen = false;
        setTimeout(() => {
          this._shouldRender = false;
          if (this.originalParent && this.el.nativeElement.parentNode === document.body) {
            this.renderer.appendChild(this.originalParent, this.el.nativeElement);
          }
        }, 300);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.el.nativeElement.parentNode) {
      this.renderer.removeChild(this.el.nativeElement.parentNode, this.el.nativeElement);
    }
  }

  get sizeClass(): string {
    if (this.customWidth) return '';
    switch (this.size) {
      case 'sm': return 'w-sm';
      case 'lg': return 'w-lg';
      case 'xl': return 'w-xl';
      case 'full': return 'w-full';
      default: return 'w-md';
    }
  }

  get panelClasses(): string {
    const visClass = this._isOpen ? 'mdl-visible' : 'mdl-hidden';
    return `mdl-panel ${visClass} ${this.sizeClass}`;
  }

  get contentClasses(): string {
    return this.noContentPadding ? 'mdl-content mdl-content-nopad' : 'mdl-content';
  }

  onBackdropClick(): void {
    if (this.closeOnOverlayClick) {
      this.onCancel();
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.close.emit();
    this.visibleChange.emit(false);
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}
