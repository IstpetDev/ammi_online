import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { RegimenDTO } from '../../../../../data/models/Entities';
import { RegimenService } from '../../../../../core/services/settings/regimen.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-regimenes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, ToastModule, TooltipModule, ConfirmationModalComponent],
  templateUrl: './regimenes.component.html',
  styleUrls: ['./regimenes.component.css'],
  providers: [MessageService]
})
export class RegimenesComponent implements OnInit {
  regimenes: RegimenDTO[] = [];
  regimenForm: FormGroup;
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedRegimen: RegimenDTO | null = null;
  showConfirmDelete: boolean = false;
  regimenToDelete: RegimenDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private regimenService: RegimenService,
    private messageService: MessageService
  ) {
    this.regimenForm = this.fb.group({
      idRegimen: [null],
      detalle: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRegimenes();
  }

  loadRegimenes(): void {
    this.regimenService.getAll().subscribe({
      next: (data) => {
        this.regimenes = data;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar regimenes' });
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.regimenForm.reset();
    this.displayDialog = true;
  }

  openEditDialog(regimen: RegimenDTO): void {
    this.isEditing = true;
    this.selectedRegimen = regimen;
    this.regimenForm.patchValue(regimen);
    this.displayDialog = true;
  }

  saveRegimen(): void {
    if (this.regimenForm.valid) {
      const regimen: RegimenDTO = this.regimenForm.value;
      if (this.isEditing) {
        this.regimenService.update(regimen).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Regimen actualizado correctamente' });
            this.loadRegimenes();
            this.displayDialog = false;
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar regimen' });
          }
        });
      } else {
        this.regimenService.create(regimen).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Regimen creado correctamente' });
            this.loadRegimenes();
            this.displayDialog = false;
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear regimen' });
          }
        });
      }
    }
  }

  confirmDelete(regimen: RegimenDTO): void {
    this.regimenToDelete = regimen;
    this.showConfirmDelete = true;
  }

  deleteRegimen(): void {
    if (this.regimenToDelete) {
      this.regimenService.delete(this.regimenToDelete.idRegimen!).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Regimen eliminado correctamente' });
          this.loadRegimenes();
          this.showConfirmDelete = false;
          this.regimenToDelete = null;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar regimen' });
        }
      });
    }
  }

  onHideDialog(): void {
    this.displayDialog = false;
    this.regimenForm.reset();
  }

  onRejectDelete(): void {
    this.showConfirmDelete = false;
    this.regimenToDelete = null;
  }
}