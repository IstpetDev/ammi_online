import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { PeriodoLectivoDTO } from '../../../../../data/models/Entities';
import { PeriodoLectivoService } from '../../../../../core/services/settings/periodo-lectivo.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-periodos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, DatePickerModule, TooltipModule, ConfirmationModalComponent, SharedToastComponent],
  templateUrl: './periodos.component.html',
  styleUrls: ['./periodos.component.css'],
  providers: [MessageService]
})
export class PeriodosComponent implements OnInit {
  periodos: PeriodoLectivoDTO[] = [];
  periodoForm: FormGroup;
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedPeriodo: PeriodoLectivoDTO | null = null;
  showConfirmDelete: boolean = false;
  periodoToDelete: PeriodoLectivoDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private periodoService: PeriodoLectivoService,
    private messageService: MessageService
  ) {
    this.periodoForm = this.fb.group({
      idPeriodoLectivo: [null],
      detalle: ['', Validators.required],
      fechaInicioEstimada: [null],
      fechaFinEstimada: [null]
    });
  }

  ngOnInit(): void {
    this.loadPeriodos();
  }

  loadPeriodos(): void {
    this.periodoService.getAll().subscribe({
      next: (data) => {
        this.periodos = data;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar periodos lectivos' });
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.periodoForm.reset();
    this.displayDialog = true;
  }

  openEditDialog(periodo: PeriodoLectivoDTO): void {
    this.isEditing = true;
    this.selectedPeriodo = periodo;
    this.periodoForm.patchValue({
      ...periodo,
      fechaInicioEstimada: periodo.fechaInicioEstimada ? new Date(periodo.fechaInicioEstimada) : null,
      fechaFinEstimada: periodo.fechaFinEstimada ? new Date(periodo.fechaFinEstimada) : null,
    });
    this.displayDialog = true;
  }

  savePeriodo(): void {
    if (this.periodoForm.valid) {
      const fv = this.periodoForm.value;
      const periodo: PeriodoLectivoDTO = {
        ...fv,
        fechaInicioEstimada: fv.fechaInicioEstimada instanceof Date
          ? fv.fechaInicioEstimada.toISOString().split('T')[0]
          : fv.fechaInicioEstimada,
        fechaFinEstimada: fv.fechaFinEstimada instanceof Date
          ? fv.fechaFinEstimada.toISOString().split('T')[0]
          : fv.fechaFinEstimada,
      };
      if (this.isEditing) {
        this.periodoService.update(periodo).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Periodo lectivo actualizado correctamente' });
            this.loadPeriodos();
            this.displayDialog = false;
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar periodo lectivo' });
          }
        });
      } else {
        this.periodoService.create(periodo).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Periodo lectivo creado correctamente' });
            this.loadPeriodos();
            this.displayDialog = false;
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear periodo lectivo' });
          }
        });
      }
    }
  }

  confirmDelete(periodo: PeriodoLectivoDTO): void {
    this.periodoToDelete = periodo;
    this.showConfirmDelete = true;
  }

  deletePeriodo(): void {
    if (this.periodoToDelete) {
      this.periodoService.delete(this.periodoToDelete.idPeriodoLectivo!).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Periodo lectivo eliminado correctamente' });
          this.loadPeriodos();
          this.showConfirmDelete = false;
          this.periodoToDelete = null;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar periodo lectivo' });
        }
      });
    }
  }

  onHideDialog(): void {
    this.displayDialog = false;
    this.periodoForm.reset();
  }

  onRejectDelete(): void {
    this.showConfirmDelete = false;
    this.periodoToDelete = null;
  }
}