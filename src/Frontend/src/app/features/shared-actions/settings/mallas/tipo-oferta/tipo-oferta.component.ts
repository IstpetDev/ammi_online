
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { TipoOfertaDTO } from '../../../../../data/models/Entities';
import { TipoOfertaService } from '../../../../../core/services/infrastructure/tipo-oferta.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';
@Component({
  selector: 'app-tipo-oferta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, TagModule, CheckboxModule, ToggleButtonModule, TooltipModule, ConfirmationModalComponent, SharedToastComponent],
  templateUrl: './tipo-oferta.component.html',
  styleUrls: ['./tipo-oferta.component.css'],
  providers: [MessageService]
})
export class TipoOfertaComponent implements OnInit {
  tiposOferta: TipoOfertaDTO[] = [];
  tipoOfertaForm: FormGroup;
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedTipoOferta: TipoOfertaDTO | null = null;
  showConfirmDelete: boolean = false;
  tipoOfertaToDelete: TipoOfertaDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private tipoOfertaService: TipoOfertaService,
    private messageService: MessageService
  ) {
    this.tipoOfertaForm = this.fb.group({
      idtipoOferta: [null],
      detalle: ['', Validators.required],
      duracion: [null, [Validators.required, Validators.min(0)]],
      esActivo: [true]
    });
  }

  ngOnInit(): void {
    this.loadTiposOferta();
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

    // Cambia el estado activo/inactivo de un tipo de oferta
    toggleActivo(tipoOferta: TipoOfertaDTO): void {
      const nuevoEstado = !tipoOferta.esActivo;
      this.tipoOfertaService.update({ ...tipoOferta, esActivo: nuevoEstado }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Tipo de oferta ${nuevoEstado ? 'activado' : 'desactivado'} correctamente` });
          this.loadTiposOferta();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado' });
        }
      });
    }

  openCreateDialog(): void {
    this.isEditing = false;
    // Por defecto, enviar esActivo por detrás como true
    this.tipoOfertaForm.reset({ esActivo: true });
    this.displayDialog = true;
  }

  openEditDialog(tipoOferta: TipoOfertaDTO): void {
    this.isEditing = true;
    this.selectedTipoOferta = tipoOferta;
    // Rellenar el formulario con los valores existentes (esActivo se mantiene en el payload aunque esté oculto)
    this.tipoOfertaForm.patchValue({ ...tipoOferta });
    this.displayDialog = true;
  }

  saveTipoOferta(): void {
    if (this.tipoOfertaForm.valid) {
      const tipoOferta: TipoOfertaDTO = this.tipoOfertaForm.value;
      if (this.isEditing) {
        this.tipoOfertaService.update(tipoOferta).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Tipo de oferta actualizado correctamente' });
            this.loadTiposOferta();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar tipo de oferta' });
          }
        });
      } else {
        this.tipoOfertaService.create(tipoOferta).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Tipo de oferta creado correctamente' });
            this.loadTiposOferta();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear tipo de oferta' });
          }
        });
      }
    }
  }

  confirmDelete(tipoOferta: TipoOfertaDTO): void {
    this.tipoOfertaToDelete = tipoOferta;
    this.showConfirmDelete = true;
  }

  deleteTipoOferta(): void {
    if (this.tipoOfertaToDelete?.idtipoOferta) {
      this.tipoOfertaService.delete(this.tipoOfertaToDelete.idtipoOferta).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Tipo de oferta eliminado correctamente' });
          this.loadTiposOferta();
          this.showConfirmDelete = false;
          this.tipoOfertaToDelete = null;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar tipo de oferta' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.tipoOfertaToDelete = null;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.tipoOfertaForm.reset();
  }
}