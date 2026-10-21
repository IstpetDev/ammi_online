import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, TemplateRef, AfterContentInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  field: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface PageEvent {
  page: number;
  rows: number;
}

export interface SortEvent {
  field: string;
  order: 'asc' | 'desc';
}

import { Directive, Input as DirInput } from '@angular/core';

@Directive({
  selector: '[stColTemplate]',
  standalone: true
})
export class SharedTableColTemplateDirective {
  constructor(public template: TemplateRef<any>) { }
  @DirInput('stColTemplate') columnField: string = '';
}

@Component({
  selector: 'app-shared-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="st-wrapper">
      <div class="st-table-container" [class.st-loading]="loading">
        <table class="st-table">
          <thead class="st-thead">
            <tr>
              @for (col of columns; track col.field) {
                <th class="st-th" [style.width]="col.width || 'auto'" [style.text-align]="col.align || 'left'"
                    [class.st-sortable]="col.sortable" (click)="onSortClick(col)">
                  <div class="st-th-content">
                    <span>{{ col.header }}</span>
                    @if (col.sortable) {
                      <span class="st-sort-icons">
                        <svg class="st-sort-arrow" [class.st-sort-active]="sortField === col.field && sortOrder === 'asc'"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </span>
                    }
                  </div>
                </th>
              }
            </tr>
          </thead>
          <tbody class="st-tbody">
            @if (data.length === 0 && !loading) {
              <tr>
                <td class="st-empty-row" [attr.colspan]="columns.length">
                  <div class="st-empty-inner">
                    <svg class="st-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <span>{{ emptyMessage }}</span>
                  </div>
                </td>
              </tr>
            }
            @for (row of data; track trackByFn(row)) {
              <tr class="st-tr" [class.st-tr-clickable]="selectable" (click)="onRowClick(row)">
                @for (col of columns; track col.field) {
                  <td class="st-td" [style.text-align]="col.align || 'left'">
                    @if (getTemplate(col.field); as tmpl) {
                      <ng-container *ngTemplateOutlet="tmpl; context: { $implicit: row, row: row }" />
                    } @else {
                      {{ resolveField(row, col.field) }}
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>

        @if (loading) {
          <div class="st-loading-overlay">
            <svg class="st-spinner" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4" />
            </svg>
          </div>
        }
      </div>

      @if (paginator && totalPages > 1) {
        <div class="st-paginator">
          <span class="st-paginator-info">{{ (page - 1) * rowsPerPage + 1 }}–{{ Math.min(page * rowsPerPage, totalRecords) }} de {{ totalRecords }}</span>
          <div class="st-paginator-controls">
            <button class="st-page-btn" [disabled]="page <= 1" (click)="goToPage(1)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></svg>
            </button>
            <button class="st-page-btn" [disabled]="page <= 1" (click)="goToPage(page - 1)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            @for (p of visiblePages; track p) {
              <button class="st-page-btn st-page-num" [class.st-page-active]="p === page" (click)="goToPage(p)">{{ p }}</button>
            }
            <button class="st-page-btn" [disabled]="page >= totalPages" (click)="goToPage(page + 1)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <button class="st-page-btn" [disabled]="page >= totalPages" (click)="goToPage(totalPages)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .st-wrapper { width: 100%; font-family: 'Poppins', sans-serif; }
    .st-table-container {
      position: relative; width: 100%; overflow-x: auto;
      border: 1px solid var(--surface-border); border-radius: 12px;
      background: var(--surface-card);
    }
    .st-table { width: 100%; border-collapse: collapse; }
    .st-thead { background: var(--surface-ground); }
    .st-th {
      padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 700;
      color: var(--text-color); text-transform: uppercase; letter-spacing: 0.5px;
      border-bottom: 2px solid var(--brand-yellow-dark); white-space: nowrap;
      user-select: none;
    }
    .st-sortable { cursor: pointer; }
    .st-sortable:hover { background: var(--surface-hover); }
    .st-th-content { display: flex; align-items: center; gap: 0.35rem; }
    .st-sort-icons { display: inline-flex; }
    .st-sort-arrow { width: 14px; height: 14px; color: var(--text-color-secondary); transition: color 0.15s; }
    .st-sort-active { color: var(--brand-yellow-dark); }
    .st-tbody { background: var(--surface-card); }
    .st-tr { transition: background 0.15s; }
    .st-tr:hover { background: var(--surface-hover); }
    .st-tr-clickable { cursor: pointer; }
    .std-td { transition: none; }
    .st-td {
      padding: 0.85rem 1rem; font-size: 0.875rem;
      color: var(--text-color); border-bottom: 1px solid var(--surface-border);
    }
    .st-tr:last-child .st-td { border-bottom: none; }
    .st-empty-row { text-align: center; padding: 3rem 1rem; }
    .st-empty-inner {
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
      color: var(--text-color-secondary); font-size: 0.9rem;
    }
    .st-empty-icon { width: 40px; height: 40px; opacity: 0.5; }
    .st-loading { opacity: 0.6; pointer-events: none; }
    .st-loading-overlay {
      position: absolute; inset: 0; z-index: 5;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.5);
    }
    .st-spinner { width: 32px; height: 32px; color: var(--brand-yellow-dark); animation: st-spin 0.8s linear infinite; }
    @keyframes st-spin { to { transform: rotate(360deg); } }
    /* Paginator */
    .st-paginator {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1rem; gap: 1rem; flex-wrap: wrap;
      border-top: 1px solid var(--surface-border);
      background: var(--surface-ground);
    }
    .st-paginator-info { font-size: 0.8rem; color: var(--text-color-secondary); font-weight: 500; }
    .st-paginator-controls { display: flex; align-items: center; gap: 0.25rem; }
    .st-page-btn {
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      background: transparent; border: 1px solid var(--surface-border); border-radius: 8px;
      color: var(--text-color-secondary); cursor: pointer; transition: all 0.15s;
      font-size: 0.8rem; font-weight: 600;
    }
    .st-page-btn svg { width: 16px; height: 16px; }
    .st-page-btn:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--brand-yellow-dark); color: var(--brand-yellow-dark); }
    .st-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .st-page-num { width: 36px; }
    .st-page-active { background: var(--brand-yellow-dark) !important; border-color: var(--brand-yellow-dark) !important; color: var(--brand-black) !important; font-weight: 700; }
    :host-context(.app-dark) .st-loading-overlay { background: rgba(0,0,0,0.4); }
    :host-context(.app-dark) .st-table-container { background: var(--surface-card); }
    :host-context(.app-dark) .st-thead { background: var(--surface-ground); }
    :host-context(.app-dark) .st-tbody { background: var(--surface-card); }
  `]
})
export class SharedTableComponent implements AfterContentInit, OnDestroy {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading: boolean = false;
  @Input() totalRecords: number = 0;
  @Input() rowsPerPage: number = 10;
  @Input() page: number = 1;
  @Input() paginator: boolean = true;
  @Input() emptyMessage: string = 'No hay registros disponibles';
  @Input() selectable: boolean = false;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<SortEvent>();

  @ContentChildren(SharedTableColTemplateDirective, { descendants: true }) columnTemplates!: QueryList<SharedTableColTemplateDirective>;

  sortField: string = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  Math = Math;

  private templateMap: Map<string, TemplateRef<any>> = new Map();
  private templateSub?: Subscription;
  private cdr = inject(ChangeDetectorRef);

  private rebuildTemplateMap(): void {
    this.templateMap.clear();
    this.columnTemplates.forEach(dir => {
      this.templateMap.set(dir.columnField, dir.template);
    });
    this.cdr.markForCheck();
  }

  ngAfterContentInit(): void {
    this.rebuildTemplateMap();
    this.templateSub = this.columnTemplates.changes.subscribe(() => {
      this.rebuildTemplateMap();
    });
  }

  ngOnDestroy(): void {
    this.templateSub?.unsubscribe();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.rowsPerPage));
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.page;
    const pages: number[] = [];
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    if (end - start < 4) {
      if (start === 1) end = Math.min(total, start + 4);
      else start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  getTemplate(field: string): TemplateRef<any> | null {
    return this.templateMap.get(field) || null;
  }

  resolveField(row: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], row) ?? '';
  }

  trackByFn(row: any): any {
    return row?.idPostulacion ?? row?.id ?? row;
  }

  onSortClick(col: TableColumn): void {
    if (!col.sortable) return;
    if (this.sortField === col.field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = col.field;
      this.sortOrder = 'asc';
    }
    this.sortChange.emit({ field: this.sortField, order: this.sortOrder });
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.pageChange.emit({ page: p, rows: this.rowsPerPage });
  }

  onRowClick(row: any): void {
    if (this.selectable) {
      this.rowClick.emit(row);
    }
  }
}
