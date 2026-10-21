import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cs-wrapper" (click)="$event.stopPropagation()">
      <div class="cs-trigger" (click)="toggleOpen()" [class.cs-disabled]="disabled" [class.cs-open]="isOpen" [class.cs-focused]="isOpen">
        @if (loading) {
          <div class="cs-loading">
            <svg class="cs-spinner" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4" />
            </svg>
          </div>
        } @else {
          <input #inputRef
            [value]="isOpen ? filterText : selectedLabel"
            (input)="onInputChange($event)"
            [placeholder]="selectedLabel ? '' : placeholder"
            [disabled]="disabled"
            class="cs-input"
            readonly=""
            tabindex="-1"
          />
          <svg class="cs-chevron" [class.cs-chevron-open]="isOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        }
      </div>

      @if (isOpen) {
        <div class="cs-dropdown" [class.cs-dropdown-up]="dropdownUp">
          @if (searchable) {
            <div class="cs-search">
              <svg class="cs-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                #searchInput
                [value]="filterText"
                (input)="onSearchInput($event)"
                placeholder="Buscar..."
                class="cs-search-input"
                (click)="$event.stopPropagation()"
              />
            </div>
          }
          <div class="cs-options">
            @if (filteredItems.length === 0) {
              <div class="cs-empty">No hay opciones disponibles</div>
            }
            @for (item of filteredItems; track getValue(item)) {
              <div class="cs-option" [class.cs-option-selected]="getValue(item) === selectedValue" (click)="selectOption(item)">
                <span>{{ getLabel(item) }}</span>
                @if (getValue(item) === selectedValue) {
                  <svg class="cs-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cs-wrapper { position: relative; width: 100%; font-family: 'Poppins', sans-serif; }
    .cs-trigger {
      display: flex; align-items: center; gap: 0.5rem;
      width: 100%; min-height: 46px;
      padding: 0 1rem;
      background: var(--surface-card); border: 2px solid var(--surface-border);
      border-radius: 12px; cursor: pointer;
      transition: all 0.2s ease;
    }
    .cs-trigger:hover { border-color: var(--brand-yellow-dark); }
    .cs-trigger.cs-open { border-color: var(--brand-yellow-dark); box-shadow: 0 0 0 3px rgba(233, 185, 2, 0.15); }
    .cs-trigger.cs-disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
    .cs-input {
      flex: 1; min-width: 0;
      background: transparent; border: none; outline: none;
      font-size: 0.875rem; color: #000000;
      cursor: pointer; font-family: inherit; pointer-events: none;
    }
    .cs-input::placeholder { color: #666666; }
    .cs-chevron {
      width: 18px; height: 18px; flex-shrink: 0;
      color: #666666;
      transition: transform 0.2s ease;
    }
    .cs-chevron-open { transform: rotate(180deg); }
    .cs-loading { flex: 1; display: flex; align-items: center; }
    .cs-spinner {
      width: 20px; height: 20px; color: var(--brand-yellow-dark);
      animation: cs-spin 1s linear infinite;
    }
    @keyframes cs-spin { to { transform: rotate(360deg); } }
    .cs-dropdown {
      position: absolute; z-index: 999; top: calc(100% + 6px); left: 0; right: 0;
      background: #ffffff; border: 2px solid #e0e0e0;
      border-radius: 14px; overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      animation: cs-fadeIn 0.15s ease-out;
    }
    .cs-dropdown.cs-dropdown-up {
      top: auto; bottom: calc(100% + 6px);
      animation-name: cs-fadeInUp;
    }
    @keyframes cs-fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes cs-fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .cs-search {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem; border-bottom: 1px solid #e0e0e0;
    }
    .cs-search-icon { width: 16px; height: 16px; color: #666666; flex-shrink: 0; }
    .cs-search-input {
      flex: 1; min-width: 0;
      background: transparent; border: none; outline: none;
      font-size: 0.8rem; color: #000000; font-family: inherit;
    }
    .cs-search-input::placeholder { color: #666666; }
    .cs-options { max-height: 220px; overflow-y: auto; padding: 0.375rem; }
    .cs-option {
      display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
      padding: 0.6rem 0.75rem; border-radius: 10px;
      font-size: 0.825rem; color: #000000;
      cursor: pointer; transition: all 0.15s ease;
    }
    .cs-option:hover { background: #f0f0f0; }
    .cs-option-selected { background: #e8e8e8; color: #000000; font-weight: 600; }
    .cs-option-selected:hover { background: #dcdcdc; }
    .cs-check { width: 16px; height: 16px; flex-shrink: 0; color: #000000; }
    .cs-empty { padding: 1.5rem; text-align: center; font-size: 0.8rem; color: #666666; }
    :host-context(.app-dark) .cs-input { color: #ffffff; pointer-events: none; }
    :host-context(.app-dark) .cs-input::placeholder { color: #999999; }
    :host-context(.app-dark) .cs-chevron { color: #999999; }
    :host-context(.app-dark) .cs-dropdown { background: #1e1e1e; border-color: #333333; }
    :host-context(.app-dark) .cs-search { border-bottom-color: #333333; }
    :host-context(.app-dark) .cs-search-icon { color: #999999; }
    :host-context(.app-dark) .cs-search-input { color: #ffffff; }
    :host-context(.app-dark) .cs-search-input::placeholder { color: #999999; }
    :host-context(.app-dark) .cs-option { color: #ffffff; }
    :host-context(.app-dark) .cs-option:hover { background: #2a2a2a; }
    :host-context(.app-dark) .cs-option-selected { background: #333333; color: #ffffff; }
    :host-context(.app-dark) .cs-option-selected:hover { background: #3a3a3a; }
    :host-context(.app-dark) .cs-check { color: #ffffff; }
    :host-context(.app-dark) .cs-empty { color: #999999; }
  `]
})
export class CustomSelectComponent {
  @Input() items: any[] = [];
  @Input() labelField: string = 'label';
  @Input() valueField: string = 'value';
  @Input() selectedValue: any = null;
  @Input() placeholder: string = 'Seleccione...';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() searchable: boolean = true;

  @Output() selectedValueChange = new EventEmitter<any>();
  @Output() onFocus = new EventEmitter<void>();
  @Output() onBlur = new EventEmitter<void>();

  isOpen: boolean = false;
  filterText: string = '';
  dropdownUp: boolean = false;

  constructor(private elementRef: ElementRef) {}

  get selectedLabel(): string {
    if (!this.items) return '';
    const selected = this.items.find(item => this.getValue(item) === this.selectedValue);
    return selected ? this.getLabel(selected) : '';
  }

  get filteredItems(): any[] {
    if (!this.items) return [];
    if (!this.filterText.trim()) return this.items;
    const search = this.filterText.toLowerCase().trim();
    return this.items.filter(item => this.getLabel(item).toLowerCase().includes(search));
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

    const itemCount = Math.min(this.filteredItems.length, 6);
    const searchHeight = this.searchable ? 55 : 0;
    const estimatedHeight = searchHeight + (itemCount * 38) + 16;
    const maxDropdownHeight = Math.min(estimatedHeight, 280);

    this.dropdownUp = spaceBelow < maxDropdownHeight && spaceAbove > spaceBelow;
  }

  onInputChange(event: Event): void {
    if (!this.isOpen) {
      this.isOpen = true;
    }
    this.filterText = (event.target as HTMLInputElement).value;
  }

  onSearchInput(event: Event): void {
    this.filterText = (event.target as HTMLInputElement).value;
  }

  onFocusHandler(): void {
    if (!this.isOpen) {
      this.isOpen = true;
      this.filterText = '';
    }
    this.onFocus.emit();
  }

  onBlurHandler(): void {
    setTimeout(() => {
      this.onBlur.emit();
    }, 150);
  }

  selectOption(item: any): void {
    this.selectedValue = this.getValue(item);
    this.selectedValueChange.emit(this.selectedValue);
    this.filterText = '';
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isOpen) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isOpen) {
      this.isOpen = false;
    }
  }
}
