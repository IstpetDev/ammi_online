import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MallaRequisitosDTO, MallaDTO, RequisitoDTO } from '../../../../../data/models/Entities';
import { MallaRequisitosService } from '../../../../../core/services/settings/malla-requisitos.service';
import { MallaService } from '../../../../../core/services/infrastructure/malla.service';
import { RequisitosService } from '../../../../../core/services/settings/requisitos.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-malla-requisitos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, MultiSelectModule, ToastModule, TooltipModule, ConfirmationModalComponent],
  templateUrl: './malla-requisitos.component.html',
  styleUrls: ['./malla-requisitos.component.css'],
  providers: [MessageService]
})
export class MallaRequisitosComponent implements OnInit {
  mallaRequisitos: MallaRequisitosDTO[] = [];
  mallas: MallaDTO[] = [];
  requisitos: RequisitoDTO[] = [];
  requisitosOptions: any[] = [];
  mallaRequisitoForm: FormGroup;
  massiveForm: FormGroup;
  replicateForm: FormGroup;
  displayDialog: boolean = false;
  displayMassiveDialog: boolean = false;
  displayReplicateDialog: boolean = false;
  showConfirmDelete: boolean = false;
  mallaRequisitoToDelete: MallaRequisitosDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private mallaRequisitosService: MallaRequisitosService,
    private mallaService: MallaService,
    private requisitosService: RequisitosService,
    private messageService: MessageService
  ) {
    this.mallaRequisitoForm = this.fb.group({
      idMalla: [null, Validators.required],
      idRequisito: [null, Validators.required]
    });
    this.massiveForm = this.fb.group({
      idMalla: [null, Validators.required],
      requisitoIds: [[], Validators.required]
    });
    this.replicateForm = this.fb.group({
      sourceMalla: [null, Validators.required],
      targetMalla: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadMallaRequisitos();
    this.loadMallas();
    this.loadRequisitos();
  }

  loadMallaRequisitos(): void {
    this.mallaRequisitosService.getAll().subscribe({
      next: (data) => {
        this.mallaRequisitos = data;
        console.log('Malla Requisitos cargados:', this.mallaRequisitos);
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar malla requisitos' });
      }
    });
  }

  loadMallas(): void {
    this.mallaService.getAll().subscribe({
      next: (data) => {
        this.mallas = data;
        console.log('Mallas cargadas:', this.mallas);
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar mallas' });
      }
    });
  }

  loadRequisitos(): void {
    this.requisitosService.getAll().subscribe({
      next: (data) => {
        this.requisitos = data;
        this.requisitosOptions = data.map(r => ({ label: r.detalle, value: r.idRequisitos }));
        console.log('Requisitos cargados:', this.requisitos);
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar requisitos' });
      }
    });
  }

  openCreateDialog(): void {
    this.mallaRequisitoForm.reset();
    this.displayDialog = true;
  }

  saveMallaRequisito(): void {
    if (this.mallaRequisitoForm.valid) {
      const formValue = this.mallaRequisitoForm.value;
      const mallaRequisito: MallaRequisitosDTO = {
        ...formValue,
        idMalla: +formValue.idMalla,
        idRequisito: +formValue.idRequisito
      };
      this.mallaRequisitosService.create(mallaRequisito).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla requisito creado correctamente' });
          this.loadMallaRequisitos();
          this.displayDialog = false;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear malla requisito' });
        }
      });
    }
  }

  confirmDelete(mallaRequisito: MallaRequisitosDTO): void {
    this.mallaRequisitoToDelete = mallaRequisito;
    this.showConfirmDelete = true;
  }

  deleteMallaRequisito(): void {
    if (this.mallaRequisitoToDelete?.idMallaRequisitos) {
      this.mallaRequisitosService.delete(this.mallaRequisitoToDelete.idMallaRequisitos).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla requisito eliminado correctamente' });
          this.loadMallaRequisitos();
          this.showConfirmDelete = false;
          this.mallaRequisitoToDelete = null;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar malla requisito' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.mallaRequisitoToDelete = null;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.mallaRequisitoForm.reset();
  }

  getMallaName(idMalla: number): string {
    const malla = this.mallas.find(m => m.idMalla === idMalla);
    return malla?.detalle || '';
  }

  getRequisitoName(idRequisito: number): string {
    const requisito = this.requisitos.find(r => r.idRequisitos === idRequisito);
    return requisito?.detalle || '';
  }

  openMassiveDialog(): void {
    this.massiveForm.reset();
    this.displayMassiveDialog = true;
  }

  saveMassiveAssignment(): void {
    if (this.massiveForm.valid) {
      const { idMalla, requisitoIds } = this.massiveForm.value;
      this.requisitosService.asignarRequisitosAMalla(+idMalla, requisitoIds).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Requisitos asignados masivamente' });
          this.loadMallaRequisitos();
          this.displayMassiveDialog = false;
        },
        error: (error: any) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al asignar requisitos' });
        }
      });
    }
  }

  hideMassiveDialog(): void {
    this.displayMassiveDialog = false;
    this.massiveForm.reset();
  }

  openReplicateDialog(): void {
    this.replicateForm.reset();
    this.displayReplicateDialog = true;
  }

  saveReplicate(): void {
    if (this.replicateForm.valid) {
      const { sourceMalla, targetMalla } = this.replicateForm.value;
      // Get requisitos of source malla
      const sourceRequisitos = this.mallaRequisitos.filter(mr => mr.idMalla === +sourceMalla).map(mr => mr.idRequisitos).filter(id => id !== undefined) as number[];
      if (sourceRequisitos.length > 0) {
        this.requisitosService.asignarRequisitosAMalla(+targetMalla, sourceRequisitos).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Requisitos replicados correctamente' });
            this.loadMallaRequisitos();
            this.displayReplicateDialog = false;
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error al replicar requisitos' });
          }
        });
      } else {
        this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'La malla origen no tiene requisitos' });
      }
    }
  }

  hideReplicateDialog(): void {
    this.displayReplicateDialog = false;
    this.replicateForm.reset();
  }
}
