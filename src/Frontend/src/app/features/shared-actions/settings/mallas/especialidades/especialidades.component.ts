import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { EspecialidadDTO } from '../../../../../data/models/Entities';
import { EspecialidadService } from '../../../../../core/services/infrastructure/especialidad.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-especialidades',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, TooltipModule, ConfirmationModalComponent, SharedToastComponent],
  templateUrl: './especialidades.component.html',
  styleUrls: ['./especialidades.component.css'],
  providers: [MessageService]
})
export class EspecialidadesComponent implements OnInit {
  especialidades: EspecialidadDTO[] = [];
  especialidadForm: FormGroup;
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedEspecialidad: EspecialidadDTO | null = null;
  showConfirmDelete: boolean = false;
  especialidadToDelete: EspecialidadDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private especialidadService: EspecialidadService,
    private messageService: MessageService
  ) {
    this.especialidadForm = this.fb.group({
      idEspecialidad: [null],
      Detalle: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadEspecialidades();
  }

  loadEspecialidades(): void {
    this.especialidadService.getAll().subscribe({
      next: (data) => {
        console.log('Datos recibidos del servicio especialidades:', data);
        this.especialidades = Array.isArray(data) ? data : [];
        console.log('Especialidades asignadas:', this.especialidades);
      },
      error: (error) => {
        console.error('Error al cargar especialidades:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar especialidades' });
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.especialidadForm.reset();
    this.displayDialog = true;
  }

  openEditDialog(especialidad: EspecialidadDTO): void {
    this.isEditing = true;
    this.selectedEspecialidad = especialidad;
    this.especialidadForm.patchValue(especialidad);
    this.displayDialog = true;
  }

  saveEspecialidad(): void {
    if (this.especialidadForm.valid) {
      const especialidad: EspecialidadDTO = this.especialidadForm.value;
      if (this.isEditing) {
        this.especialidadService.update(especialidad).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Especialidad actualizada correctamente' });
            this.loadEspecialidades();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar especialidad' });
          }
        });
      } else {
        this.especialidadService.create(especialidad).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Especialidad creada correctamente' });
            this.loadEspecialidades();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear especialidad' });
          }
        });
      }
    }
  }

  confirmDelete(especialidad: EspecialidadDTO): void {
    this.especialidadToDelete = especialidad;
    this.showConfirmDelete = true;
  }

  deleteEspecialidad(): void {
    if (this.especialidadToDelete?.idEspecialidad) {
      this.especialidadService.delete(this.especialidadToDelete.idEspecialidad).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Especialidad eliminada correctamente' });
          this.loadEspecialidades();
          this.showConfirmDelete = false;
          this.especialidadToDelete = null;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar especialidad' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.especialidadToDelete = null;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.especialidadForm.reset();
  }
}