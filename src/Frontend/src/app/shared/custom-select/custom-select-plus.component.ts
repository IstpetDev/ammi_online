import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CreateFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number';
  required: boolean;
  placeholder?: string;
}

@Component({
  selector: 'app-custom-select-plus',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="csp-wrapper" (click)="$event.stopPropagation()">
      <div class="csp-row">
        <div class="csp-trigger" (click)="toggleOpen()" [class.csp-disabled]="disabled" [class.csp-open]="isOpen">
          @if (loading) {
            <div class="csp-loading">
              <svg class="csp-spinner" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4" />
              </svg>
            </div>
          } @else {
            <input
              [value]="isOpen ? filterText : selectedLabel"
              (input)="onInputChange($event)"
              (focus)="onFocusHandler()"
              [placeholder]="selectedLabel ? '' : placeholder"
              [disabled]="disabled"
              class="csp-input"
              readonly=""
            />
            <svg class="csp-chevron" [class.csp-chevron-open]="isOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          }
        </div>
        <button type="button" class="csp-add-btn" (click)="openCreateDialog()" [disabled]="disabled" title="Crear nuevo">
          <svg class="csp-add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      @if (isOpen) {
        <div class="csp-dropdown" [class.csp-dropdown-up]="dropdownUp">
          @if (searchable) {
            <div class="csp-search">
              <svg class="csp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                [value]="filterText"
                (input)="onSearchInput($event)"
                placeholder="Buscar..."
                class="csp-search-input"
                (click)="$event.stopPropagation()"
              />
            </div>
          }
          <div class="csp-options">
            @if (filteredItems.length === 0) {
              <div class="csp-empty">No hay opciones disponibles</div>
            }
            @for (item of filteredItems; track getValue(item)) {
              <div class="csp-option" [class.csp-option-selected]="getValue(item) === selectedValue" (click)="selectOption(item)">
                <span>{{ getLabel(item) }}</span>
                @if (getValue(item) === selectedValue) {
                  <svg class="csp-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (showCreateDialog_) {
        <div class="csp-overlay" (click)="closeCreateDialog()"></div>
        <div class="csp-create-dialog">
          <div class="csp-create-header">
            <h3 class="csp-create-title">{{ createDialogTitle }}</h3>
            <button type="button" class="csp-create-close" (click)="closeCreateDialog()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="csp-create-close-icon">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="csp-create-body">
            @for (field of createFields; track field.key) {
              <div class="csp-field">
                <label class="csp-field-label">
                  {{ field.label }}
                  @if (field.required) { <span class="csp-required">*</span> }
                </label>
                @if (field.type === 'text') {
                  <input
                    type="text"
                    [placeholder]="field.placeholder || field.label"
                    class="csp-field-input"
                    (input)="onFieldInput(field.key, $event)"
                  />
                } @else if (field.type === 'number') {
                  <input
                    type="number"
                    [placeholder]="field.placeholder || field.label"
                    class="csp-field-input"
                    (input)="onFieldInput(field.key, $event)"
                  />
                }
              </div>
            }
          </div>
          <div class="csp-create-footer">
            <button type="button" class="csp-btn csp-btn-cancel" (click)="closeCreateDialog()">Cancelar</button>
            <button type="button" class="csp-btn csp-btn-save" (click)="saveNewItem()" [disabled]="!isCreateFormValid">Guardar</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .csp-wrapper { position: relative; width: 100%; font-family: 'Poppins', sans-serif; }
    .csp-row { display: flex; align-items: center; gap: 0.5rem; }
    .csp-trigger {
      display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;
      min-height: 46px; padding: 0 1rem;
      background: var(--surface-card); border: 2px solid var(--surface-border);
      border-radius: 12px; cursor: pointer;
      transition: all 0.2s ease;
    }
    .csp-trigger:hover { border-color: var(--brand-yellow-dark); }
    .csp-trigger.csp-open { border-color: var(--brand-yellow-dark); box-shadow: 0 0 0 3px rgba(233, 185, 2, 0.15); }
    .csp-trigger.csp-disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
    .csp-input {
      flex: 1; min-width: 0;
      background: transparent; border: none; outline: none;
      font-size: 0.875rem; color: var(--text-color);
      cursor: pointer; font-family: inherit;
    }
    .csp-input::placeholder { color: var(--text-color-secondary); }
    .csp-chevron { width: 18px; height: 18px; flex-shrink: 0; color: var(--text-color-secondary); transition: transform 0.2s ease; }
    .csp-chevron-open { transform: rotate(180deg); }
    .csp-loading { flex: 1; display: flex; align-items: center; }
    .csp-spinner { width: 20px; height: 20px; color: var(--brand-yellow-dark); animation: csp-spin 1s linear infinite; }
    @keyframes csp-spin { to { transform: rotate(360deg); } }
    .csp-add-btn {
      flex-shrink: 0; width: 46px; height: 46px;
      display: flex; align-items: center; justify-content: center;
      background: var(--brand-yellow-dark); border: 2px solid var(--brand-yellow-dark);
      border-radius: 12px; cursor: pointer;
      transition: all 0.2s ease;
    }
    .csp-add-btn:hover { background: var(--brand-yellow); border-color: var(--brand-yellow); }
    .csp-add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .csp-add-icon { width: 20px; height: 20px; color: var(--brand-black); }
    .csp-dropdown {
      position: absolute; z-index: 999; top: calc(100% + 6px); left: 0; right: 0;
      background: var(--surface-card); border: 2px solid var(--surface-border);
      border-radius: 14px; overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      animation: csp-fadeIn 0.15s ease-out;
    }
    .csp-dropdown.csp-dropdown-up {
      top: auto; bottom: calc(100% + 6px);
      animation-name: csp-fadeInUp;
    }
    @keyframes csp-fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes csp-fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .csp-search { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border-bottom: 1px solid var(--surface-border); }
    .csp-search-icon { width: 16px; height: 16px; color: var(--text-color-secondary); flex-shrink: 0; }
    .csp-search-input { flex: 1; min-width: 0; background: transparent; border: none; outline: none; font-size: 0.8rem; color: var(--text-color); font-family: inherit; }
    .csp-search-input::placeholder { color: var(--text-color-secondary); }
    .csp-options { max-height: 220px; overflow-y: auto; padding: 0.375rem; }
    .csp-option {
      display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
      padding: 0.6rem 0.75rem; border-radius: 10px;
      font-size: 0.825rem; color: var(--text-color);
      cursor: pointer; transition: all 0.15s ease;
    }
    .csp-option:hover { background: var(--surface-hover); }
    .csp-option-selected { background: rgba(233, 185, 2, 0.12); color: var(--brand-yellow-dark); font-weight: 600; }
    .csp-option-selected:hover { background: rgba(233, 185, 2, 0.2); }
    .csp-check { width: 16px; height: 16px; flex-shrink: 0; }
    .csp-empty { padding: 1.5rem; text-align: center; font-size: 0.8rem; color: var(--text-color-secondary); }

    /* Create Dialog */
    .csp-overlay {
      position: fixed; inset: 0; z-index: 1999;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);
      animation: csp-fadeIn 0.15s ease-out;
    }
    .csp-create-dialog {
      position: fixed; z-index: 2000;
      top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 90%; max-width: 420px;
      background: var(--surface-card); border: 2px solid var(--surface-border);
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      animation: csp-scaleIn 0.2s ease-out;
    }
    @keyframes csp-scaleIn { from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
    .csp-create-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
    }
    .csp-create-title { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-color); }
    .csp-create-close {
      background: none; border: none; cursor: pointer;
      color: var(--text-color-secondary); padding: 0.25rem; border-radius: 6px; transition: all 0.15s ease;
    }
    .csp-create-close:hover { color: var(--text-color); background: var(--surface-hover); }
    .csp-create-close-icon { width: 18px; height: 18px; }
    .csp-create-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .csp-field { display: flex; flex-direction: column; gap: 0.35rem; }
    .csp-field-label { font-size: 0.8rem; font-weight: 600; color: var(--text-color); }
    .csp-required { color: var(--error-color); }
    .csp-field-input {
      width: 100%; padding: 0.6rem 0.85rem;
      background: var(--surface-section); border: 2px solid var(--surface-border);
      border-radius: 10px; font-size: 0.85rem; color: var(--text-color);
      outline: none; font-family: inherit;
      transition: border-color 0.2s ease;
    }
    .csp-field-input:focus { border-color: var(--brand-yellow-dark); box-shadow: 0 0 0 3px rgba(233, 185, 2, 0.12); }
    .csp-create-footer {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--surface-border);
    }
    .csp-btn {
      padding: 0.55rem 1.25rem; border-radius: 10px;
      font-size: 0.8rem; font-weight: 700; cursor: pointer;
      transition: all 0.2s ease; font-family: inherit;
    }
    .csp-btn-cancel {
      background: transparent; border: 2px solid var(--surface-border);
      color: var(--text-color-secondary);
    }
    .csp-btn-cancel:hover { border-color: var(--text-color-secondary); color: var(--text-color); }
    .csp-btn-save {
      background: var(--brand-yellow-dark); border: 2px solid var(--brand-yellow-dark);
      color: var(--brand-black);
    }
    .csp-btn-save:hover { background: var(--brand-yellow); border-color: var(--brand-yellow); }
    .csp-btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

    :host-context(.app-dark) .csp-trigger { background: var(--surface-card); border-color: var(--surface-border); }
    :host-context(.app-dark) .csp-dropdown { background: var(--surface-card); border-color: var(--surface-border); }
    :host-context(.app-dark) .csp-option:hover { background: var(--surface-hover); }
    :host-context(.app-dark) .csp-create-dialog { background: var(--surface-card); border-color: var(--surface-border); }
  `]
})
export class CustomSelectPlusComponent {
  @Input() items: any[] = [];
  @Input() labelField: string = 'label';
  @Input() valueField: string = 'value';
  @Input() selectedValue: any = null;
  @Input() placeholder: string = 'Seleccione...';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() searchable: boolean = true;

  @Input() createDialogTitle: string = 'Crear Nuevo';
  @Input() createFields: CreateFieldConfig[] = [];

  @Output() selectedValueChange = new EventEmitter<any>();
  @Output() create = new EventEmitter<void>();
  @Output() createItem = new EventEmitter<Record<string, any>>();
  @Output() onFocus = new EventEmitter<void>();
  @Output() onBlur = new EventEmitter<void>();

  isOpen: boolean = false;
  filterText: string = '';
  showCreateDialog_ = false;
  formData: Record<string, any> = {};
  dropdownUp: boolean = false;

  constructor(private elementRef: ElementRef) {}

  get selectedLabel(): string {
    const selected = this.items.find(item => this.getValue(item) === this.selectedValue);
    return selected ? this.getLabel(selected) : '';
  }

  get filteredItems(): any[] {
    if (!this.filterText.trim()) return this.items;
    const search = this.filterText.toLowerCase().trim();
    return this.items.filter(item => this.getLabel(item).toLowerCase().includes(search));
  }

  get isCreateFormValid(): boolean {
    return this.createFields.every(f => !f.required || (this.formData[f.key]?.toString().trim()));
  }

  getValue(item: any): any {
    return item?.[this.valueField];
  }

  getLabel(item: any): string {
    return item?.[this.labelField] ?? '';
  }

  toggleOpen(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.filterText = '';
      this.checkDropdownDirection();
    }
  }

  private checkDropdownDirection(): void {
    const el = this.elementRef.nativeElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    this.dropdownUp = spaceBelow < 260 && spaceAbove > spaceBelow;
  }

  onInputChange(event: Event): void {
    if (!this.isOpen) this.isOpen = true;
    this.filterText = (event.target as HTMLInputElement).value;
  }

  onSearchInput(event: Event): void {
    this.filterText = (event.target as HTMLInputElement).value;
  }

  onFocusHandler(): void {
    if (!this.isOpen) { this.isOpen = true; this.filterText = ''; }
    this.onFocus.emit();
  }

  selectOption(item: any): void {
    this.selectedValue = this.getValue(item);
    this.selectedValueChange.emit(this.selectedValue);
    this.filterText = '';
    this.isOpen = false;
  }

  openCreateDialog(): void {
    this.formData = {};
    this.showCreateDialog_ = true;
    this.create.emit();
  }

  closeCreateDialog(): void {
    this.showCreateDialog_ = false;
    this.formData = {};
  }

  onFieldInput(key: string, event: Event): void {
    this.formData[key] = (event.target as HTMLInputElement).value;
  }

  saveNewItem(): void {
    if (!this.isCreateFormValid) return;
    this.createItem.emit({ ...this.formData });
    this.closeCreateDialog();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
