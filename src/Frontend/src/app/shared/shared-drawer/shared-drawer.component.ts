import { Component, Input, Output, EventEmitter, ElementRef, Renderer2, OnChanges, OnDestroy, AfterViewInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (_shouldRender) {
      <div class="drwr-fixed" [class.drwr-items-center]="mode === 'modal'" [class.drwr-justify-center]="mode === 'modal'">
        <div (click)="onBackdropClick()" class="drwr-backdrop" [class.drwr-backdrop-visible]="_isOpen" [class.drwr-backdrop-hidden]="!_isOpen"></div>

        <div (click)="$event.stopPropagation()" [class]="panelClasses">
          @if (title || showCloseButton) {
            <div [class]="headerClasses">
              <h3 class="drwr-title">
                <ng-content select="[drawer-title]"></ng-content>
                @if (title) {
                  <span class="drwr-title-text">{{ title }}</span>
                }
              </h3>
              @if (showCloseButton) {
                <button (click)="onCancel()" class="drwr-close-btn" [attr.aria-label]="'Cerrar'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="drwr-close-icon">
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
            <div [class]="footerClasses">
              <ng-content select="[drawer-footer]"></ng-content>
              @if (cancelText) {
                <button (click)="onCancel()" type="button" class="drwr-btn drwr-btn-cancel">{{ cancelText }}</button>
              }
              @if (confirmText) {
                <button (click)="onConfirm()" type="button" class="drwr-btn drwr-btn-confirm" [disabled]="confirmDisabled || confirmLoading">
                  @if (confirmLoading) {
                    <svg class="drwr-btn-spinner" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4" />
                    </svg>
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
    .drwr-fixed { position: fixed; inset: 0; z-index: 1020; display: flex; font-family: 'Poppins', sans-serif; }
    .drwr-items-center { align-items: center; }
    .drwr-justify-center { justify-content: center; }
    .drwr-backdrop {
      position: absolute; inset: 0; z-index: 0;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
      transition: all 0.3s ease-out;
    }
    .drwr-backdrop-visible { opacity: 1; }
    .drwr-backdrop-hidden { opacity: 0; }

    /* Panel base */
    .drwr-panel {
      position: absolute; top: 0; bottom: 0; z-index: 1;
      background: var(--surface-card);
      display: flex; flex-direction: column; overflow: hidden;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .drwr-panel-left {
      left: 0;
      border-right: 1px solid var(--surface-border);
      box-shadow: 4px 0 24px rgba(0,0,0,0.15);
    }
    .drwr-panel-left.drwr-hidden { transform: translateX(-100%); border-right-color: transparent; box-shadow: none; }
    .drwr-panel-left.drwr-visible { transform: translateX(0); }
    .drwr-panel-right {
      right: 0;
      border-left: 1px solid var(--surface-border);
      box-shadow: -4px 0 24px rgba(0,0,0,0.15);
    }
    .drwr-panel-right.drwr-hidden { transform: translateX(100%); border-left-color: transparent; box-shadow: none; }
    .drwr-panel-right.drwr-visible { transform: translateX(0); }

    /* Modal mode */
    .drwr-modal-panel {
      position: relative; margin: auto; z-index: 1;
      background: var(--surface-card);
      border-radius: 16px; overflow: hidden;
      max-height: 90vh; border: 1px solid var(--surface-border);
      transition: all 0.3s ease-out;
    }
    .drwr-modal-hidden { opacity: 0; transform: scale(0.95); }
    .drwr-modal-visible { opacity: 1; transform: scale(1); }

    /* Header */
    .drwr-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
      flex-shrink: 0;
    }
    .drwr-title { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; }
    .drwr-title-text {
      font-weight: 700; color: var(--text-color);
      border-left: 4px solid var(--brand-yellow-dark); padding-left: 0.75rem;
    }
    .drwr-close-btn {
      flex-shrink: 0; width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      background: transparent; border: none; border-radius: 8px; cursor: pointer;
      color: var(--text-color-secondary);
      transition: all 0.2s ease;
    }
    .drwr-close-btn:hover { color: var(--text-color); background: var(--surface-hover); }
    .drwr-close-icon { width: 18px; height: 18px; }

    /* Content */
    .drwr-content {
      flex: 1; overflow-y: auto; min-height: 0;
      padding: 1.5rem;
      color: var(--text-color); font-size: 0.9rem; line-height: 1.6;
    }
    .drwr-content-nopad { padding: 0; }

    /* Footer */
    .drwr-footer {
      display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--surface-border);
      flex-shrink: 0;
    }
    .drwr-btn {
      padding: 0.6rem 1.25rem; border-radius: 10px;
      font-size: 0.8rem; font-weight: 700; cursor: pointer;
      transition: all 0.2s ease; font-family: inherit;
      display: inline-flex; align-items: center; gap: 0.5rem;
    }
    .drwr-btn-cancel {
      background: transparent; border: 2px solid var(--surface-border);
      color: var(--text-color-secondary);
    }
    .drwr-btn-cancel:hover { border-color: var(--text-color-secondary); color: var(--text-color); }
    .drwr-btn-confirm {
      background: var(--brand-yellow-dark); border: 2px solid var(--brand-yellow-dark);
      color: var(--brand-black);
    }
    .drwr-btn-confirm:hover { background: var(--brand-yellow); border-color: var(--brand-yellow); }
    .drwr-btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
    .drwr-btn-spinner { width: 16px; height: 16px; animation: drwr-spin 1s linear infinite; }
    @keyframes drwr-spin { to { transform: rotate(360deg); } }

    :host-context(.app-dark) .drwr-panel { background: var(--surface-card); }
    :host-context(.app-dark) .drwr-modal-panel { background: var(--surface-card); border-color: var(--surface-border); }
    :host-context(.app-dark) .drwr-backdrop { background: rgba(0,0,0,0.7); }
  `]
})
export class SharedDrawerComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() visible: boolean = false;
  @Input() title: string = '';
  @Input() mode: 'drawer' | 'modal' = 'drawer';
  @Input() position: 'left' | 'right' = 'left';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' = 'md';
  @Input() showCloseButton: boolean = true;
  @Input() closeOnOverlayClick: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() cancelText: string = '';
  @Input() confirmText: string = '';
  @Input() confirmDisabled: boolean = false;
  @Input() confirmLoading: boolean = false;
  @Input() noContentPadding: boolean = false;

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
        this.renderer.addClass(document.body, 'drwr-open');
        this._shouldRender = true;
        setTimeout(() => { this._isOpen = true; }, 20);
      } else {
        this._isOpen = false;
        this.renderer.removeClass(document.body, 'drwr-open');
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
    // Asegurar que el scroll del body quede libre al destruir el componente
    this.renderer.removeClass(document.body, 'drwr-open');
    if (this.el.nativeElement.parentNode) {
      this.renderer.removeChild(this.el.nativeElement.parentNode, this.el.nativeElement);
    }
  }

  get sizeClasses(): string {
    switch (this.size) {
      case 'sm': return 'max-w-sm md:max-w-md';
      case 'lg': return 'max-w-2xl md:max-w-4xl';
      case 'xl': return 'max-w-4xl md:max-w-6xl';
      case '2xl': return 'max-w-6xl md:max-w-7xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-lg md:max-w-2xl';
    }
  }

  get drawerSizeClasses(): string {
    switch (this.size) {
      case 'sm': return 'w-full md:w-[320px]';
      case 'lg': return 'w-full md:w-[600px]';
      case 'xl': return 'w-full md:w-[850px]';
      case '2xl': return 'w-full md:w-[1080px] md:max-w-[88vw]';
      case 'full': return 'w-full';
      default: return 'w-full md:w-[480px]';
    }
  }

  get panelClasses(): string {
    if (this.mode === 'drawer') {
      const isLeft = this.position === 'left';
      const sideClass = isLeft ? 'drwr-panel-left' : 'drwr-panel-right';
      const visClass = this._isOpen ? 'drwr-visible' : 'drwr-hidden';
      return `drwr-panel ${sideClass} ${visClass} ${this.drawerSizeClasses}`;
    }
    const visClass = this._isOpen ? 'drwr-modal-visible' : 'drwr-modal-hidden';
    return `drwr-modal-panel ${visClass} ${this.sizeClasses}`;
  }

  get headerClasses(): string {
    return 'drwr-header';
  }

  get contentClasses(): string {
    return this.noContentPadding ? 'drwr-content drwr-content-nopad' : 'drwr-content';
  }

  get footerClasses(): string {
    return 'drwr-footer';
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
