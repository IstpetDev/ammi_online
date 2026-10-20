import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { PeriodoLectivoDTO } from '../../../../../data/models/Entities';
import { PeriodoLectivoService } from '../../../../../core/services/settings/periodo-lectivo.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-periodos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, ToastModule, TooltipModule, ConfirmationModalComponent],
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
    this.periodoForm.patchValue(periodo);
    this.displayDialog = true;
  }

  savePeriodo(): void {
    if (this.periodoForm.valid) {
      const periodo: PeriodoLectivoDTO = this.periodoForm.value;
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