import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MateriaDTO } from '../../../../../data/models/Entities';
import { MateriaService } from '../../../../../core/services/infrastructure/materia.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, CheckboxModule, ToggleButtonModule, ToastModule, TooltipModule, ConfirmationModalComponent],
  templateUrl: './materias.component.html',
  styleUrls: ['./materias.component.css'],
  providers: [MessageService]
})
export class MateriasComponent implements OnInit {
  materias: MateriaDTO[] = [];
  materiaForm: FormGroup;
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedMateria: MateriaDTO | null = null;
  showConfirmDelete: boolean = false;
  materiaToDelete: MateriaDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private materiaService: MateriaService,
    private messageService: MessageService
  ) {
    this.materiaForm = this.fb.group({
      idMateria: [null],
      detalle: ['', Validators.required],
      horasRequeridas: [null, Validators.required],
      esActivo: [true]
    });
  }

  ngOnInit(): void {
    this.loadMaterias();
  }

  loadMaterias(): void {
    this.materiaService.getAll().subscribe({
      next: (data) => {
        console.log('Datos recibidos del servicio:', data);
        console.log('Items:', data?.items);
        this.materias = Array.isArray(data?.items) ? data.items : [];
        console.log('Materias asignadas:', this.materias);
      },
      error: (error) => {
        console.error('Error al cargar materias:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar materias' });
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.materiaForm.reset({ esActivo: true });
    this.displayDialog = true;
  }

  openEditDialog(materia: MateriaDTO): void {
    this.isEditing = true;
    this.selectedMateria = materia;
    this.materiaForm.patchValue(materia);
    this.displayDialog = true;
  }

  saveMateria(): void {
    if (this.materiaForm.valid) {
      const materia: MateriaDTO = this.materiaForm.value;
      if (this.isEditing) {
        this.materiaService.update(materia).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materia actualizada correctamente' });
            this.loadMaterias();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar materia' });
          }
        });
      } else {
        this.materiaService.create(materia).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materia creada correctamente' });
            this.loadMaterias();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear materia' });
          }
        });
      }
    }
  }

  confirmDelete(materia: MateriaDTO): void {
    this.materiaToDelete = materia;
    this.showConfirmDelete = true;
  }

  deleteMateria(): void {
    if (this.materiaToDelete?.idMateria) {
      this.materiaService.delete(this.materiaToDelete.idMateria).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materia eliminada correctamente' });
          this.loadMaterias();
          this.showConfirmDelete = false;
          this.materiaToDelete = null;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar materia' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.materiaToDelete = null;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.materiaForm.reset();
  }
}