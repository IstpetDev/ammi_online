import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RequisitoDTO } from '../../../../data/models/Entities';
import { RequisitosService } from '../../../../core/services/settings/requisitos.service';
import { SharedTableComponent, TableColumn, SharedTableColTemplateDirective } from '../../../../shared/shared-table/shared-table.component';
import { SharedDrawerComponent } from '../../../../shared/shared-drawer/shared-drawer.component';
import { SharedRevertToastComponent } from '../../../../shared/shared-revert-toast/shared-revert-toast.component';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';
import { ToastService } from '../../../../shared/toast.service';

@Component({
  selector: 'app-requisitos-postulacion',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    SharedTableComponent, SharedTableColTemplateDirective,
    SharedDrawerComponent, SharedRevertToastComponent, SharedToastComponent
  ],
  template: `
    <div class="rp-container">
      <div class="rp-toolbar">
        <button class="rp-btn rp-btn-primary" (click)="openCreateDialog()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="rp-btn-icon">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Requisito
        </button>
      </div>

      <app-shared-table
        [columns]="columns"
        [data]="requisitos"
        [loading]="loading"
        [totalRecords]="requisitos.length"
        [rowsPerPage]="10"
        [paginator]="true"
        [selectable]="false"
        emptyMessage="No hay requisitos registrados"
      >
        <ng-template stColTemplate="tipoDato" let-row>
          <span>{{ row.tipoDato === 'BOOL' ? 'Confirmación' : 'Documento Adjunto' }}</span>
        </ng-template>

        <ng-template stColTemplate="esObligatorio" let-row>
          <span>{{ row.esObligatorio ? 'Obligatorio' : 'Opcional' }}</span>
        </ng-template>

        <ng-template stColTemplate="bloqueaInscripcion" let-row>
          <span>{{ row.bloqueaInscripcion ? 'Bloquea' : 'No Bloquea' }}</span>
        </ng-template>

        <ng-template stColTemplate="acciones" let-row>
          <div class="rp-actions">
            <button class="rp-action-btn rp-action-edit" (click)="openEditDialog(row)" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rp-action-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="rp-action-btn rp-action-delete" (click)="confirmDelete(row)" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rp-action-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </ng-template>
      </app-shared-table>

      <app-shared-drawer
        [(visible)]="showForm"
        [title]="isEditing ? 'Editar Requisito' : 'Nuevo Requisito'"
        [mode]="'modal'"
        [size]="'md'"
        [showCloseButton]="true"
        [closeOnOverlayClick]="false"
        [showFooter]="true"
        cancelText="Cancelar"
        confirmText="Guardar"
        [confirmDisabled]="!requisitoForm.valid"
        (cancel)="hideDialog()"
        (confirm)="saveRequisito()">
        <div drawer-title></div>

        <form [formGroup]="requisitoForm" class="rp-form">
          <div class="rp-field">
            <label class="rp-label">Detalle <span class="rp-required">*</span></label>
            <input class="rp-input" formControlName="detalle" placeholder="Ej: Certificado de votación" />
            @if (requisitoForm.get('detalle')?.invalid && requisitoForm.get('detalle')?.touched) {
              <span class="rp-error">El detalle es requerido</span>
            }
          </div>

          <div class="rp-field">
            <label class="rp-label">Tipo de Requisito <span class="rp-required">*</span></label>
            <select class="rp-select" formControlName="tipoDato">
              <option value="BOOL">Confirmación</option>
              <option value="ADJUNTO">Documento Adjunto</option>
            </select>
            <div class="rp-helper">
              <span><strong>Confirmación:</strong> el administrador marca si el postulante cumple.</span>
              <span><strong>Documento Adjunto:</strong> el postulante debe subir un archivo.</span>
            </div>
          </div>

          <div class="rp-field-row">
            <div class="rp-field rp-field-half">
              <label class="rp-label">Obligatoriedad</label>
              <label class="rp-toggle">
                <input type="checkbox" formControlName="esObligatorio" />
                <span class="rp-toggle-slider"></span>
                <span class="rp-toggle-label">{{ requisitoForm.get('esObligatorio')?.value ? 'Obligatorio' : 'Opcional' }}</span>
              </label>
            </div>

            <div class="rp-field rp-field-half">
              <label class="rp-label">Bloquea Inscripción</label>
              <label class="rp-toggle">
                <input type="checkbox" formControlName="bloqueaInscripcion" />
                <span class="rp-toggle-slider"></span>
                <span class="rp-toggle-label">{{ requisitoForm.get('bloqueaInscripcion')?.value ? 'Bloquea' : 'No Bloquea' }}</span>
              </label>
            </div>
          </div>
        </form>
      </app-shared-drawer>

      <app-shared-revert-toast
        [(visible)]="showRevertToast"
        title="ELIMINACIÓN PENDIENTE"
        message="El requisito se eliminará automáticamente a menos que reviertas la acción."
        revertLabel="REVERTIR"
        [timeoutSeconds]="10"
        (revert)="revertDelete()"
        (timeout)="executeDelete()">
      </app-shared-revert-toast>

      <app-shared-toast></app-shared-toast>
    </div>
  `,
  styles: [`
    .rp-container { font-family: 'Poppins', sans-serif; padding: 0.5rem 0; }
    .rp-toolbar { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
    .rp-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.6rem 1.25rem; border-radius: 10px; font-weight: 700;
      font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease;
      font-family: inherit; border: none;
    }
    .rp-btn-primary {
      background: var(--brand-yellow-dark); color: var(--brand-black);
    }
    .rp-btn-primary:hover { background: var(--brand-yellow); transform: translateY(-1px); }
    .rp-btn-icon { width: 16px; height: 16px; }

    .rp-actions { display: flex; gap: 0.35rem; justify-content: center; }
    .rp-action-btn {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      background: transparent; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s;
    }
    .rp-action-btn:hover { background: var(--surface-hover); }
    .rp-action-icon { width: 16px; height: 16px; color: var(--text-color-secondary); }

    .rp-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .rp-field { display: flex; flex-direction: column; gap: 0.35rem; }
    .rp-field-row { display: flex; gap: 1rem; }
    .rp-field-half { flex: 1; }
    .rp-label { font-size: 0.85rem; font-weight: 600; color: var(--text-color); }
    .rp-required { color: #ef4444; }
    .rp-input, .rp-select {
      padding: 0.65rem 0.85rem; border: 2px solid var(--surface-border);
      border-radius: 8px; font-size: 0.85rem; font-family: inherit;
      background: var(--surface-card); color: var(--text-color);
      transition: border-color 0.2s;
    }
    .rp-input:focus, .rp-select:focus { outline: none; border-color: var(--brand-yellow-dark); }
    .rp-select { cursor: pointer; }
    .rp-error { font-size: 0.75rem; color: #ef4444; }
    .rp-helper {
      display: flex; flex-direction: column; gap: 0.25rem;
      padding: 0.6rem 0.85rem; border-radius: 6px;
      border-left: 3px solid var(--brand-yellow-dark);
      font-size: 0.78rem; color: var(--text-color-secondary);
    }

    .rp-toggle {
      display: inline-flex; align-items: center; gap: 0.6rem; cursor: pointer;
      padding: 0.4rem 0; user-select: none;
    }
    .rp-toggle input { display: none; }
    .rp-toggle-slider {
      position: relative; width: 44px; height: 24px;
      background: var(--surface-border); border-radius: 12px;
      transition: all 0.25s;
    }
    .rp-toggle-slider::after {
      content: ''; position: absolute; top: 3px; left: 3px;
      width: 18px; height: 18px; background: #fff; border-radius: 50%;
      transition: transform 0.25s;
    }
    .rp-toggle input:checked + .rp-toggle-slider { background: var(--brand-yellow-dark); }
    .rp-toggle input:checked + .rp-toggle-slider::after { transform: translateX(20px); }
    .rp-toggle-label { font-size: 0.85rem; font-weight: 500; color: var(--text-color-secondary); }
  `]
})
export class RequisitosPostulacionComponent implements OnInit {
  requisitos: RequisitoDTO[] = [];
  loading = false;
  showForm = false;
  isEditing = false;
  selectedRequisito: RequisitoDTO | null = null;
  showRevertToast = false;
  requisitoToDelete: RequisitoDTO | null = null;

  columns: TableColumn[] = [
    { field: 'detalle', header: 'Detalle', sortable: true, align: 'center' },
    { field: 'tipoDato', header: 'Tipo', width: '180px', align: 'center' },
    { field: 'esObligatorio', header: 'Obligatorio', width: '130px', align: 'center' },
    { field: 'bloqueaInscripcion', header: 'Bloquea Inscripción', width: '160px', align: 'center' },
    { field: 'acciones', header: 'Acciones', width: '100px', align: 'center' }
  ];

  requisitoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private requisitosService: RequisitosService,
    private toastService: ToastService
  ) {
    this.requisitoForm = this.fb.group({
      idRequisitos: [null],
      idMalla: [0],
      detalle: ['', Validators.required],
      esObligatorio: [false],
      bloqueaInscripcion: [false],
      tipoDato: ['BOOL']
    });
  }

  ngOnInit(): void {
    this.loadRequisitos();
  }

  loadRequisitos(): void {
    this.loading = true;
    this.requisitosService.getAll().subscribe({
      next: (data) => {
        this.requisitos = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.showError('Error al cargar requisitos');
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.selectedRequisito = null;
    this.requisitoForm.reset({ idMalla: 0, esObligatorio: false, bloqueaInscripcion: false, tipoDato: 'BOOL' });
    this.showForm = true;
  }

  openEditDialog(requisito: RequisitoDTO): void {
    this.isEditing = true;
    this.selectedRequisito = requisito;
    this.requisitoForm.patchValue({
      idRequisitos: requisito.idRequisitos,
      idMalla: requisito.idMalla || 0,
      detalle: requisito.detalle,
      esObligatorio: requisito.esObligatorio ?? false,
      bloqueaInscripcion: requisito.bloqueaInscripcion ?? false,
      tipoDato: requisito.tipoDato || 'BOOL'
    });
    this.showForm = true;
  }

  saveRequisito(): void {
    if (this.requisitoForm.invalid) return;

    const requisito: RequisitoDTO = {
      ...this.requisitoForm.value,
      esObligatorio: this.requisitoForm.value.esObligatorio ?? false,
      bloqueaInscripcion: this.requisitoForm.value.bloqueaInscripcion ?? false,
      esMayorEdad: false,
      idMalla: this.requisitoForm.value.idMalla ?? 0
    };

    if (this.isEditing) {
      this.requisitosService.update(requisito).subscribe({
        next: () => {
          this.toastService.showSuccess('Requisito actualizado correctamente');
          this.loadRequisitos();
          this.showForm = false;
        },
        error: () => {
          this.toastService.showError('Error al actualizar requisito');
        }
      });
    } else {
      const { idRequisitos, ...requisitoData } = requisito;
      this.requisitosService.create(requisitoData).subscribe({
        next: () => {
          this.toastService.showSuccess('Requisito creado correctamente');
          this.loadRequisitos();
          this.showForm = false;
        },
        error: () => {
          this.toastService.showError('Error al crear requisito');
        }
      });
    }
  }

  confirmDelete(requisito: RequisitoDTO): void {
    this.requisitoToDelete = requisito;
    this.showRevertToast = true;
  }

  revertDelete(): void {
    this.showRevertToast = false;
    this.requisitoToDelete = null;
    this.toastService.showInfo('Eliminación cancelada', 'Cancelado');
  }

  executeDelete(): void {
    if (this.requisitoToDelete?.idRequisitos) {
      const id = this.requisitoToDelete.idRequisitos;
      this.requisitosService.delete(id).subscribe({
        next: () => {
          this.toastService.showSuccess('Requisito eliminado correctamente', 'Eliminado');
          this.loadRequisitos();
          this.requisitoToDelete = null;
        },
        error: () => {
          this.toastService.showError('Error al eliminar requisito');
          this.requisitoToDelete = null;
        }
      });
    }
  }

  hideDialog(): void {
    this.showForm = false;
    this.requisitoForm.reset({ idMalla: 0, esObligatorio: false, bloqueaInscripcion: false, tipoDato: 'BOOL' });
  }
}
