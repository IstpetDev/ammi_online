import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { CursoDTO, EspecialidadDTO } from '../../../../../data/models/Entities';
import { CursoService } from '../../../../../core/services/infrastructure/curso.service';
import { EspecialidadService } from '../../../../../core/services/infrastructure/especialidad.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, TooltipModule, ConfirmationModalComponent, SharedToastComponent],
  templateUrl: './cursos.component.html',
  styleUrls: ['./cursos.component.css'],
  providers: [MessageService]
})
export class CursosComponent implements OnInit {
  cursos: CursoDTO[] = [];
  especialidades: EspecialidadDTO[] = [];
  cursoForm: FormGroup;
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedCurso: CursoDTO | null = null;
  showConfirmDelete: boolean = false;
  cursoToDelete: CursoDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private cursoService: CursoService,
    private especialidadService: EspecialidadService,
    private messageService: MessageService
  ) {
    this.cursoForm = this.fb.group({
      // backend model uses `idCursos` (plural) per CursoDTO
      idCursos: [null],
      detalle: ['', Validators.required],
      idEspecialidad: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCursos();
    this.loadEspecialidades();
  }

  loadCursos(): void {
    this.cursoService.getAll().subscribe({
      next: (data) => {
        this.cursos = data;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar cursos' });
      }
    });
  }

  loadEspecialidades(): void {
    this.especialidadService.getAll().subscribe({
      next: (data) => {
        this.especialidades = data;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar especialidades' });
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.cursoForm.reset();
    this.displayDialog = true;
  }

  openEditDialog(curso: CursoDTO): void {
    this.isEditing = true;
    this.selectedCurso = curso;
    this.cursoForm.patchValue(curso);
    this.displayDialog = true;
  }

  saveCurso(): void {
    if (this.cursoForm.valid) {
      const formValue = this.cursoForm.value;
      // When creating, backend accepts the standard CursoDTO (uses idCursos for responses)
      if (this.isEditing) {
        // Backend expects `idCurso` (singular) in the PUT payload — map it from `idCursos` control
        const updatePayload: any = {
          idCurso: formValue.idCursos ?? formValue.idCurso ?? 0,
          idEspecialidad: formValue.idEspecialidad,
          detalle: formValue.detalle
        };
        this.cursoService.update(updatePayload).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Curso actualizado correctamente' });
            this.loadCursos();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar curso' });
          }
        });
      } else {
        const createPayload: CursoDTO = {
          idCursos: formValue.idCursos,
          idEspecialidad: formValue.idEspecialidad,
          detalle: formValue.detalle
        };
        this.cursoService.create(createPayload).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Curso creado correctamente' });
            this.loadCursos();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear curso' });
          }
        });
      }
    }
  }

  confirmDelete(curso: CursoDTO): void {
    this.cursoToDelete = curso;
    this.showConfirmDelete = true;
  }

  deleteCurso(): void {
    if (this.cursoToDelete?.idCursos) {
      this.cursoService.delete(this.cursoToDelete.idCursos).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Curso eliminado correctamente' });
          this.loadCursos();
          this.showConfirmDelete = false;
          this.cursoToDelete = null;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Error al eliminar curso' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.cursoToDelete = null;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.cursoForm.reset();
  }

  getEspecialidadName(idEspecialidad: number): string {
    const especialidad = this.especialidades.find(e => e.idEspecialidad === idEspecialidad);
    return especialidad?.detalle  || '';
  }
}