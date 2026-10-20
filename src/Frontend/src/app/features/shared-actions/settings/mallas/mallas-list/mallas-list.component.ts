import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MallaDTO, TipoOfertaDTO, CursoDTO } from '../../../../../data/models/Entities';
import { MallaService } from '../../../../../core/services/infrastructure/malla.service';
import { TipoOfertaService } from '../../../../../core/services/infrastructure/tipo-oferta.service';
import { CursoService } from '../../../../../core/services/infrastructure/curso.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-mallas-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, ToastModule, TooltipModule, ConfirmationModalComponent],
  templateUrl: './mallas-list.component.html',
  styleUrls: ['./mallas-list.component.css'],
  providers: [MessageService]
})
export class MallasListComponent implements OnInit {
  mallas: MallaDTO[] = [];
  tiposOferta: TipoOfertaDTO[] = [];
  cursos: CursoDTO[] = [];
  mallaForm: FormGroup;
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedMalla: MallaDTO | null = null;
  showConfirmDelete: boolean = false;
  mallaToDelete: MallaDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private mallaService: MallaService,
    private tipoOfertaService: TipoOfertaService,
    private cursoService: CursoService,
    private messageService: MessageService
  ) {
    this.mallaForm = this.fb.group({
      idMalla: [null],
      detalle: ['', Validators.required],
      idCursos: [null, Validators.required],
      idTipoOferta: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadMallas();
    this.loadTiposOferta();
    this.loadCursos();
  }

  loadMallas(): void {
    this.mallaService.getAll().subscribe({
      next: (data) => {
        console.log('Datos recibidos del servicio mallas:', data);
        this.mallas = Array.isArray(data) ? data : [];
        console.log('Mallas asignadas:', this.mallas);
      },
      error: (error) => {
        console.error('Error al cargar mallas:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar mallas' });
      }
    });
  }

  loadTiposOferta(): void {
    this.tipoOfertaService.getAll().subscribe({
      next: (data) => {
        this.tiposOferta = data;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar tipos de oferta' });
      }
    });
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

  openCreateDialog(): void {
    this.isEditing = false;
    this.mallaForm.reset();
    this.displayDialog = true;
  }

  openEditDialog(malla: MallaDTO): void {
    this.isEditing = true;
    this.selectedMalla = malla;
    this.mallaForm.patchValue(malla);
    this.displayDialog = true;
  }

  saveMalla(): void {
    if (this.mallaForm.valid) {
      const malla: MallaDTO = this.mallaForm.value;
      if (this.isEditing) {
        this.mallaService.update(malla).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla actualizada correctamente' });
            this.loadMallas();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar malla' });
          }
        });
      } else {
        this.mallaService.create(malla).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla creada correctamente' });
            this.loadMallas();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear malla' });
          }
        });
      }
    }
  }

  confirmDelete(malla: MallaDTO): void {
    this.mallaToDelete = malla;
    this.showConfirmDelete = true;
  }

  deleteMalla(): void {
    if (this.mallaToDelete?.idMalla) {
      this.mallaService.delete(this.mallaToDelete.idMalla).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla eliminada correctamente' });
          this.loadMallas();
          this.showConfirmDelete = false;
          this.mallaToDelete = null;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar malla' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.mallaToDelete = null;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.mallaForm.reset();
  }

  getCursoName(idCursos: number): string {
    const curso = this.cursos.find(c => c.idCursos === idCursos);
    return curso?.detalle || '';
  }

  getTipoOfertaName(idTipoOferta: number): string {
    const tipo = this.tiposOferta.find(t => t.idtipoOferta === idTipoOferta);
    return tipo?.detalle || '';
  }
}