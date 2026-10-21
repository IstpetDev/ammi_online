import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { RequisitoDTO } from '../../../../../data/models/Entities';
import { RequisitosService } from '../../../../../core/services/settings/requisitos.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-requisitos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, SelectModule, TagModule, CheckboxModule, ToggleButtonModule, TooltipModule, ConfirmationModalComponent, SharedToastComponent],
  templateUrl: './requisitos.component.html',
  styleUrls: ['./requisitos.component.css'],
  providers: [MessageService]
})
export class RequisitosComponent implements OnInit {
  requisitos: RequisitoDTO[] = [];
  requisitoForm: FormGroup;

  readonly tipoDatoOptions = [
    { label: 'Confirmación', value: 'BOOL' },
    { label: 'Documento Adjunto', value: 'ADJUNTO' }
  ];
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedRequisito: RequisitoDTO | null = null;
  showConfirmDelete: boolean = false;
  requisitoToDelete: RequisitoDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private requisitosService: RequisitosService,
    private messageService: MessageService
  ) {
    this.requisitoForm = this.fb.group({
      idRequisitos: [null],
      idMalla: [0],
      detalle: ['', Validators.required],
      esObligatorio: [false],
      bloqueaInscripcion: [false],
      tipoDato: ['BOOL'],
      esMayorEdad: [false]
    });
  }

  ngOnInit(): void {
    this.loadRequisitos();
  }

  loadRequisitos(): void {
    this.requisitosService.getAll().subscribe({
      next: (data) => {
        console.log('Requisitos recibidos:', data);
        this.requisitos = data;
      },
      error: (error) => {
        console.error('Error al cargar requisitos:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar requisitos' });
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.requisitoForm.reset();
    this.displayDialog = true;
  }

  openEditDialog(requisito: RequisitoDTO): void {
    this.isEditing = true;
    this.selectedRequisito = requisito;
    this.requisitoForm.patchValue({
      idRequisitos: requisito.idRequisitos,
      idMalla: requisito.idMalla || 0,
      detalle: requisito.detalle,
      esObligatorio: requisito.esObligatorio,
      bloqueaInscripcion: requisito.bloqueaInscripcion,
      tipoDato: requisito.tipoDato,
      esMayorEdad: requisito.esMayorEdad
    });
    this.displayDialog = true;
  }

  saveRequisito(): void {
    if (this.requisitoForm.valid) {
      const requisito: RequisitoDTO = this.requisitoForm.value;
      // Ensure boolean fields are not null
      requisito.esObligatorio = requisito.esObligatorio ?? false;
      requisito.bloqueaInscripcion = requisito.bloqueaInscripcion ?? false;
      requisito.esMayorEdad = requisito.esMayorEdad ?? false;
      // Ensure idMalla is 0 if null
      requisito.idMalla = requisito.idMalla ?? 0;
      if (this.isEditing) {
        this.requisitosService.update(requisito).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Requisito actualizado correctamente' });
            this.loadRequisitos();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar requisito' });
          }
        });
      } else {
        // For creation, exclude idRequisitos
        const { idRequisitos, ...requisitoData } = requisito;
        this.requisitosService.create(requisitoData).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Requisito creado correctamente' });
            this.loadRequisitos();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear requisito' });
          }
        });
      }
    }
  }

  confirmDelete(requisito: RequisitoDTO): void {
    this.requisitoToDelete = requisito;
    this.showConfirmDelete = true;
  }

  deleteRequisito(): void {
    if (this.requisitoToDelete?.idRequisitos) {
      this.requisitosService.delete(this.requisitoToDelete.idRequisitos).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Requisito eliminado correctamente' });
          this.loadRequisitos();
          this.showConfirmDelete = false;
          this.requisitoToDelete = null;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar requisito' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.requisitoToDelete = null;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.requisitoForm.reset();
  }
}
